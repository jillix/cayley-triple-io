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
    this._bufferSize = options.bufferSize || null;
    this._buffer = [];
    this._cayleyClient = options.cayleyClient;
    this._prefixes = options.prefixes;

    this._finishedWithError = false;

    this.on(
        'finish', 
        function handleFinish () {
            var self = this;

            // if stream did not end with an error write remaining buffer to cayley
            if (!self._finishedWithError) {
                if (self._buffer.length) {
                    self._writeBufferToCayley(function (err) {

                        if (err) {
                            this.emit('error', err);
                        }
                    });
                }
            }
        }
    );
}

util.inherits(InsertStream, Writable);

InsertStream.prototype._write = function(chunk, encoding, next) {
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
        self._writeBufferToCayley(function (err) {

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