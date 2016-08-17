// Dependencies
var utils = require('./utils')
  , async = require('async')
  , Readable = require('stream').Readable;

/* public functions start */

// CRUD create operation
exports.create = function (triples, options, callback) {
    var self = this;

    // handle no options
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // triples must be an array
    if (!(triples instanceof Array)) {
        return callback(new Error('Triple must be an array.'));
    }

    // triples cannot be empty
    if (!triples || !triples.length) {
        return callback(new Error('Triples must be provided.'));
    }

    // parse triples
    utils.parseTriples(triples, self.prefixes, function (err, triples) {

        if (err) {
            return callback(err);
        }

        self._cayleyClient.write(triples, function (err, res) {

            if (err) {
                return callback(err);
            }
            if (res.error) {
                return callback(new Error(res.error));
            }

            return callback(null, res);
        });
    });
};

// CRUD read operation
exports.read = function (query, options) {
    var self = this;
    var dataAvailable = false;
    var data = [];

    // default options
    options = options || {};
    options.out = options.out || null;
    options.deep = (typeof options.deep === 'undefined') ? true : options.deep;

    // init stream
    var stream = new Readable({
        objectMode: true,
        read: function (size) {

            // if data is not available yet fetch it
            if (!dataAvailable) {
                fetchData();
            } else {
                pushData();
            }
        }
    });

    // function that pushes data to the stream once it becomes available
    var index = 0;
    function pushData () {
        if (index === data.length) {
            stream.push(null);
        } else {
            var triple = data[index++];
            var chunk = [];

            // TODO add pretty option to IRIs
            chunk[0] = triple.subject;
            chunk[1] = triple.predicate;
            chunk[2] = utils.N3Util.isLiteral(triple.object) ? utils.getObjectValue(triple.object) : triple.object;

            if (stream.push(chunk)) {
                pushData();
            }
        }
    }

    function fetchData () {

        if (!query || !query.length) {
            stream.emit('error', new Error('A valid query array must be provided.'));
            return;
        }

        var graph = self._cayleyClient.graph;
        _computeStartNodes(graph, query, self.prefixes, function (err, startNodes) {

            if (err) {
                stream.emit('error', err);
                return;
            }

            // end stream if no start node has been found
            if (!startNodes) {
                stream.push(null);
                return;
            }

            _getAllTriples(graph, startNodes, options.deep, options.out, self.prefixes, function (err, triples) {

                if (err) {
                    stream.emit('error', err);
                    return;
                }

                // end stream if no triples have been found
                if (!triples || !triples.length) {
                    stream.push(null);
                    return;
                }
                
                dataAvailable = true;
                data = triples;
                pushData();
            });
        });
    }

    return stream;
};

// CRUD delete operation
exports.delete = function (triples, options, callback) {
    var self = this;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    if (!triples || !triples.length) {
        return callback(new Error('A valid triple array must be provided.'));
    }

    utils.parseTriples(triples, self.prefixes, function (err, triples) {

        if (err) {
            return callback(err);
        }

        self._cayleyClient.delete(triples, function (err, res) {

            if (err) {
                return callback(err);
            }
            if (res.error) {
                return callback(new Error(res.error));
            }

            return callback(null, res);
        });
    });
};

/* public functions end */

/* private functions start */

// function that gets all triples from a start node
function _getAllTriples (graph, startNodes, deep, out, prefixes, callback) {

    if (out) {
        for (var key in out) {
            var expandedKey = utils.parseValue(key, prefixes);
            out[expandedKey] = out[key];
        }
        var projections = Object.keys(out);
    } else {
        out = {};
    }

    graph.V(startNodes).Tag('subject').Out(projections, 'predicate').Tag('object').All(function (err, triples) {

        if (err) {
            return callback(err);
        }
        if (!deep) {
            return done(null, triples);
        }

        async.each(triples, function (triple, cb) {

            if (utils.N3Util.isBlank(triple.object)) {
                var cOut = out[triple.predicate];
                _getAllTriples(graph, triple.object, true, cOut, prefixes, function (err, result) {

                    if (err) {
                        return cb(err);
                    }

                    triples = triples.concat(result);
                    cb(null);
                });
            } else {
                cb(null);
            }   
        }, function (err) {
            return callback(err, triples);
        });
    });
}

// function that builds a cayley query path
function _computeStartNodes (graph, query, prefixes, callback) {

    // parse start node
    if (typeof query[0] === 'object') {
        return callback(new Error('Query start node cannot be an object or array.'));
    }
    if (query.length === 1) {
        return callback(null, utils.parseValue(query[0], prefixes));
    }
    var startNode = utils.parseValue(query[0], prefixes);

    // init path
    var path = graph.V(startNode);
    query.splice(0, 1);

    // build path
    async.each(query, function (el, cb) {

        if (el[0] === 'In') { // handle 'In' travesal

            if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                return cb(new Error('Invalid "In" query.'));
            }

            var predicate = utils.parseValue(el[1], prefixes);
            path = path.In(predicate);
            cb(null);
        } else if (el[0] === 'Out') { // handle 'Out' traversal

            if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                return cb(new Error('Invalid "Out" query.'));
            }

            var predicate = utils.parseValue(el[1], prefixes);
            path = path.Out(predicate);
            cb(null);
        } else if (el[0] === 'Has') { // handle 'Has' traversal
            if (!el[1] || !(el[1] instanceof Array) || !el[1].length) {
                return cb(new Error('Invalid "Has" query.'));
            }

            if (typeof el[1][0] === 'object' || typeof el[1][1] === 'object') {
                return cb(new Error('Invalid "Has" query.'));
            }

            if (typeof el[1][0] === 'undefined' || typeof el[1][1] === 'undefined') {
                return cb(new Error('Invalid "Has" query.'));
            }

            var predicate = utils.parseValue(el[1][0], prefixes);
            var value = utils.parseValue(el[1][1], prefixes);
            path = path.Has(predicate, value);

            cb(null);
        } else if (el[0] === 'Is') { // handle 'Is' traversal

            if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                return callback(new Error('Invalid "Is" query'));
            }

            var value = utils.parseValue(el[1], prefixes);
            path = path.Is(value);
            cb(null)
        }
    }, function (err) {

        if (err) {
            return callback(err);
        }

        // execute query
        path.All(function (err, result) {

            if (err) {
                return callback(err);
            }
            if (!result || !result.length) {
                return callback(null, null);
            }

            var startNodes = [];
            result.forEach(function (value) {
                startNodes.push(value.id);
            });

            return callback(null, startNodes);
        });
    });
}

/* private functions end */