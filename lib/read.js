// Dependencies
var utils = require('./utils')
  , util = require('util')
  , async = require('async')
  , Readable = require('stream').Readable;


// IO read readable stream
function ReadStream (query, options) {

    // init stream
    Readable.call(
        this,
        {
            objectMode: true
        }
    );

    // options
    options = options || {};
    this._options = {};
    this._options.out = options.out || null;
    this._options.deep = (typeof options.deep === 'undefined') ? true : options.deep;
    this._cayleyClient = options.cayleyClient;
    this._prefixes = options.prefixes;

    this._dataAvailable = false;
    this._buffer = [];
    this._bufferIndex = 0;
    this._query = query;
}

util.inherits(ReadStream, Readable);

ReadStream.prototype._read = function (size) {
    var self = this;

    // if data is not available for read yet fetch it
    if (!self._dataAvailable) {

        if (!self._query || !self._query.length) {
            self.emit('error', new Error('A valid query array must be provided.'));
            return;
        }

        var graph = self._cayleyClient.graph;
        _computeStartNodes(graph, self._query, self._prefixes, function (err, startNodes) {

            if (err) {
                self.emit('error', err);
                return;
            }

            // end stream if no start node has been found
            if (!startNodes) {
                self.push(null);
                return;
            }

            _getAllTriples(graph, startNodes, self._options.deep, self._options.out, self._prefixes, function (err, triples) {

                if (err) {
                    self.emit('error', err);
                    return;
                }

                // end stream if no triples have been found
                if (!triples || !triples.length) {
                    self.push(null);
                    return;
                }

                self._dataAvailable = true;
                self._buffer = triples;

                self._pushData();
            });
        });
    } else {
        self._pushData();
    }
};

ReadStream.prototype._pushData = function () {

    if (this._bufferIndex === this._buffer.length) {
        this.push(null);
    } else {
        var triple = this._buffer[this._bufferIndex++];
        var chunk = [];

        // TODO add pretty option to IRIs
        chunk[0] = triple.subject;
        chunk[1] = triple.predicate;
        chunk[2] = triple.object;

        if (this.push(chunk)) {
            this._pushData();
        }
    }
};

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

module.exports = ReadStream;