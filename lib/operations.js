// Dependencies
var utils = require('./utils')
  , async = require('async');

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
exports.read = function (query, options, callback) {
    var self = this;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    if (!query || !query.length) {
        return callback(new Error('A valid query object must be provided.'));
    }

    // init options
    options.out = options.out || null;
    options.deep = (typeof options.deep === 'undefined') ? true : options.deep;

    var graph = self._cayleyClient.graph;

    // check if a query is required
    if (query.length > 1) {
        _buildQueryPath(graph, self.prefixes, query, function (err, path) {

            if (err) {
                return callback(err);
            }

            path.All(function (err, result) {

                if (err) {
                    return callback(err);
                }
                if (!result || !result.length) {
                    return callback(null, null);
                }

                var startNode = [];
                result.forEach(function (value) {
                    startNode.push(value.id);
                });

                // start read
                doRead(startNode);
            });
        });
    } else {
        doRead(utils.parseValue(query[0], self.prefixes));
    }

    function doRead (startNode) {
        _getAllTriples(graph, startNode, options.deep, options.out, function (err, triples) {

            if (err) {
                return callback(err);
            }

            // clean triples
            triples.forEach(function (triple) {
                delete triple.id;
                if (utils.N3Util.isLiteral(triple.object)) {
                    triple.object = utils.getObjectValue(triple.object);
                };
            });


            return callback(null, triples);
        });
    }
};

// CRUD update operation
exports.update = function (triples, options, callback) {

};

// CRUD delete operation
exports.delete = function (query, options, callback) {

};

/* public functions end */

/* private functions start */

// function that gets all triples from a start node
function _getAllTriples (graph, startNode, deep, out, callback) {
    if (out) {
        var projections = Object.keys(out);
    }

    graph.V(startNode).Tag('subject').Out(projections, 'predicate').Tag('object').All(function (err, triples) {

        if (err) {
            return callback(err);
        }
        if (!deep) {
            return done(null, triples);
        }

        async.each(triples, function (triple, cb) {

            if (utils.N3Util.isBlank(triple.object)) {
                var cOut = out[triple.predicate];
                _getAllTriples(graph, triple.object, true, cOut, function (err, result) {

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
function _buildQueryPath (graph, prefixes, query, callback) {

    // parse start node
    if (typeof query[0] === 'object') {
        return callback(new Error('Query start node cannot be an object or array.'));
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

        return callback(null, path);
    });
}

/* private functions end */