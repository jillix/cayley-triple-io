// Dependencies
var cayley = require('cayley')
  , InsertStream = require('./insert')
  , DeleteStream = require('./delete')
  , ReadStream = require('./read');

/**
 * Creates a new Client instance
 *
 * @name client
 * @constructor
 * @property {Object} options Constructor options.
 * @property {String} options.url Cayley host url.
 * @property {Object} options.prefixes An object with RDF prefixes.
 * @return {Client} a Client instance.
 */
var Client = function (options) {

    if (!options) {
        throw new Error('Client requires an options object.');
    }

    if (!options.url) {
        throw new Error('No cayley url provided.')
    }

    this._cayleyClient = cayley(options.url);
    this.prefixes = options.prefixes || {};
};

/**
 * Inserts triples into cayley
 *
 * @name createInsertStream
 * @function
 * @param {Object} options Object containing stream options.
 * @param {Number} options.bufferSize The number of triples that will be colected in the internal buffer before writing to cayley. Default is 10.
 * @returns a writable stream
 */
Client.prototype.createInsertStream = function (options) {

    options = options || {};
    options.cayleyClient = this._cayleyClient;
    options.prefixes = this.prefixes;

    var insertStream = new InsertStream(options);
    return insertStream;
};

/**
 * reads triples from cayley
 *
 * @name createReadStream
 * @function
 * @param {Object} query The cayley query that will be used to find the start node.
 * @param {Object} options Object containing stream options.
 * @param {Boolean} options.deep If false only the first level endges will be traversed. Default true.
 * @param {Object} options.out A deep object containing the outgoing edges that will be traversed. If null all outgoing endges will be traversed.
 * @returns a readable stream
 */
Client.prototype.createReadStream = function (query, options) {

    options = options || {};
    options.cayleyClient = this._cayleyClient;
    options.prefixes = this.prefixes;

    var readStream = new ReadStream(query, options);
    return readStream;
};

/**
 * deletes triples from cayley
 *
 * @name createDeleteStream
 * @function
 * @param {Object} options Object containing stream options.
 * @param {Number} options.bufferSize The number of triples that will be colected in the internal buffer before deleting from cayley. Default is 10.
 * @returns a writable stream
 */
Client.prototype.createDeleteStream = function (options) {

    options = options || {};
    options.cayleyClient = this._cayleyClient;
    options.prefixes = this.prefixes;

    var deleteStream = new DeleteStream(options);
    return deleteStream;
};

// export client
module.exports = Client;