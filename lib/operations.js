// Dependencies
var utils = require('./utils');

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

};

// CRUD update operation
exports.read = function (triples, options, callback) {

};

// CRUD delete operation
exports.delete = function (query, options, callback) {

};