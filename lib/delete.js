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
    this._bufferSize = options.bufferSize || null;
    this._buffer = [];
    this._cayleyClient = options.cayleyClient;
    this._prefixes = options.prefixes;

    this._finishedWithError = false;

    this.on(
        'finish', 
        function handleFinish () {
            var self = this;

            // if stream did not end with an error send remaining buffer to cayley
            if (!self._finishedWithError) {
                if (self._buffer.length) {
                    self._sendBufferToCayley(function (err) {

                        if (err) {
                            this.emit('error', err);
                        }
                    });
                }
            }
        }
    );
}

util.inherits(DeleteStream, Writable);

DeleteStream.prototype._write = function(chunk, encoding, next) {
    var self = this;
    
    // validate data chunk
    if (!(chunk instanceof Array) || chunk.length !== 3) {
        next(new Error('Invalid data chunk format.'));
        self._finishedWithError = true;
        return self.end();
    }
    if (typeof chunk[0] !== 'string') {
        next(new Error('Invalid data chunk format.'));
        self._finishedWithError = true;
        return self.end();
    }
    if (typeof chunk[1] !== 'string') {
        next(new Error('Invalid data chunk format.'));
        self._finishedWithError = true;
        return self.end();
    }
    if (['boolean', 'number', 'string'].indexOf(typeof chunk[2]) < 0) {
        self._finishedWithError = true;
        next(new Error('Invalid data chunk format.'));
        return self.end();
    }

    // parse chunk
    var triple = utils.parseTriple(chunk, self._prefixes);
    self._buffer.push(triple);

    // if buffer reached its limit write data to cayley
    if (self._buffer.length === self._bufferSize) {
        self._sendBufferToCayley(function (err) {

            if (err) {
                self._finishedWithError = true;
                next(new Error(err));
                return self.end();
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