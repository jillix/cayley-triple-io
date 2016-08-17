// Dependencies
var cayley = require('cayley')
  , operations = require('./operations');

/**
 * Creates a new Client instance
 * @class
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
 * @name create
 * @function
 * @param {Object} triples The triples array that will be inserted
 * @param {Object} options.
 */
Client.prototype.create = operations.create;

/**
 * reads triples from cayley
 *
 * @name read
 * @function
 * @param {Object} query The cayley query that will be used to find the start node
 * @param {Object} options.
 */
Client.prototype.read = operations.read;

/**
 * deletes triples from cayley
 *
 * @name delete
 * @function
 * @param {Object} query The cayley query that will be used to find the start node
 * @param {Object} options.
 */
Client.prototype.delete = operations.delete;

// export client
module.exports = Client;