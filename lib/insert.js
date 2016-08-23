// Dependencies
var utils = require('./utils')
  , util = require('util')
  , async = require('async')
  , Writable = require('stream').Writable;

// IO insert writable stream
function InsertStream (options) {

    // init stream
    Writable.call(
        this,
        {
            objectMode: true
        }
    );

    // options
    options = options || {};
    this._bufferSize = options.bufferSize || 10;
    this._buffer = [];
    this._cayleyClient = options.cayleyClient;
    this._prefixes = options.prefixes;

    this.on(
        'finish', 
        function handleFinish () {
            var self = this;

            if (self._buffer.length) {
                self._writeBufferToCayley(function (err) {

                    if (err) {
                        return self.emit('error', err);
                    }

                    self.emit('success');
                });
            } else {
                self.emit('success');
            }
        }
    );
}

util.inherits(InsertStream, Writable);

InsertStream.prototype._write = function(chunk, encoding, next) {
    var self = this;

    // parse chunk
    var triple = utils.parseTriple(chunk);
    if (triple instanceof Error) {
        return next(triple);
    }

    self._buffer.push(triple);

    // if buffer reached its limit write data to cayley
    if (self._buffer.length === self._bufferSize) {
        self._writeBufferToCayley(function (err) {

            if (err) {
                return next(new Error(err));
            }

            self._buffer = [];
            next();
        });
    } else {
        next();
    }
};

InsertStream.prototype._writeBufferToCayley = function(callback) {

    this._cayleyClient.write(this._buffer, function (err, res) {

        if (err) {
            return callback(err);
        }
        if (res.error) {
            return callback(new Erorr(res.error));
        }

        callback(null);
    });
};

module.exports = InsertStream;