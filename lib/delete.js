// Dependencies
var utils = require('./utils')
  , util = require('util')
  , async = require('async')
  , Writable = require('stream').Writable;

// IO delete writable stream
function DeleteStream (options) {

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
                self._sendBufferToCayley(function (err) {

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

util.inherits(DeleteStream, Writable);

DeleteStream.prototype._write = function(chunk, encoding, next) {
    var self = this;

    // parse chunk
    var triple = utils.parseTriple(chunk);
    if (triple instanceof Error) {
        return next(triple);
    }

    self._buffer.push(triple);

    // if buffer reached its limit write data to cayley
    if (self._buffer.length === self._bufferSize) {
        self._sendBufferToCayley(function (err) {

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

DeleteStream.prototype._sendBufferToCayley = function(callback) {

    this._cayleyClient.delete(this._buffer, function (err, res) {

        if (err) {
            return callback(err);
        }
        if (res.error) {
            return callback(new Erorr(res.error));
        }

        callback(null);
    });
};

module.exports = DeleteStream;