// Dependencies
var utils = require('./utils')
  , util = require('util')
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
    this._options.projections = (options.projections && options.projections instanceof Array) ? options.projections : [];
    this._options.out = (options.out && options.out instanceof Array) ? options.out : [];
    this._options.deep = (typeof options.deep === 'undefined') ? true : options.deep;
    this._cayleyClient = options.cayleyClient;
    this._prefixes = options.prefixes;

    // init
    this._dataAvailable = false;
    this._buffer = [];
    this._bufferIndex = 0;
    this._query = query;

    // expand out predicates
    for (var i = 0; i < this._options.out.length; ++i) {
        this._options.out[i] = utils.parseValue(this._options.out[i], this._prefixes);
    }

    // expand projections
    for (var i = 0; i < this._options.projections.length; ++i) {
        this._options.projections[i] = utils.parseValue(this._options.projections[i], this._prefixes);
    }
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

        _computeStartNodes.call(self, function (err, startNodes) {

            if (err) {
                self.emit('error', err);
                return;
            }

            // end stream if no start node has been found
            if (!startNodes) {
                self.push(null);
                return;
            }

            _getAllTriples.call(self, startNodes, function (err, triples) {

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
        var chunk = this._buffer[this._bufferIndex++];

        if (this.push(chunk)) {
            this._pushData();
        }
    }
};

// function that gets all triples from a start node
function _getAllTriples (nodes, callback) {
    var self = this;
    var graph = self._cayleyClient.graph;
    var prefixes = self._prefixes;
    var projections = self._options.projections;
    var out = self._options.out;
    var query = self._query;

    // get first level triples
    graph.V(nodes).Tag('subject').Out(self._options.projections, 'predicate').Tag('object').All(function (err, data) {

        if (err) {
            return callback(err);
        }
        if (!data) {
            return callback(null, []);
        }

        var deepNodes = [];
        var finalData = [];
        data.forEach(function (triple) {

            if (!triple) {
                return;
            }

            if (utils.N3Util.isBlank(triple.object) || out.indexOf(triple.predicate) >= 0) {
                if (deepNodes.indexOf(triple.object) < 0 ) {
                    deepNodes.push(triple.object);
                }
            }

            finalData.push([
                triple.subject,
                triple.predicate,
                triple.object
            ]);
        });

        if (!deepNodes.length) {
            return callback(null, finalData);
        } else {
            _getAllTriples.call(self, deepNodes, function (err, deepData) {

                if (err) {
                    return callback(err);
                }
                if (!deepData) {
                    return callback(null, finalData);
                }

                return callback(null, finalData.concat(deepData));
            });
        }
    });
}

// function that builds a cayley query path
function _computeStartNodes (callback) {
    var self = this;
    var graph = self._cayleyClient.graph;
    var prefixes = self._prefixes;
    var query = self._query;

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

    // build the graph path
    for (var i = 0; i < query.length; ++i) {
        var el = query[i];

        switch (el[0]) {
            case 'In': // handle 'In' travesal
                if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                    return callback(new Error('Invalid "In" query.'));
                }

                var predicate = utils.parseValue(el[1], prefixes);
                path = path.In(predicate);
                break;
            case 'Out': // handle 'Out' travesal    
                if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                    return callback(new Error('Invalid "Out" query.'));
                }

                var predicate = utils.parseValue(el[1], prefixes);
                path = path.Out(predicate);
                break
            case 'Has': // handle 'Has' travesal
                if (!el[1] || !(el[1] instanceof Array) || !el[1].length) {
                    return callback(new Error('Invalid "Has" query.'));
                }

                if (typeof el[1][0] === 'object' || typeof el[1][1] === 'object') {
                    return callback(new Error('Invalid "Has" query.'));
                }

                if (typeof el[1][0] === 'undefined' || typeof el[1][1] === 'undefined') {
                    return callback(new Error('Invalid "Has" query.'));
                }

                var predicate = utils.parseValue(el[1][0], prefixes);
                var value = utils.parseValue(el[1][1], prefixes);
                path = path.Has(predicate, value);
                break
            case 'Is': // handle 'Is' travesal
                if (typeof el[1] === 'object' || typeof el[1] === 'undefined') {
                    return callback(new Error('Invalid "Is" query'));
                }

                var value = utils.parseValue(el[1], prefixes);
                path = path.Is(value);
                break
            default:
                return callback(new Error('Invalid query.'));
        }
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
}

module.exports = ReadStream;
