// Dependencies
var jsonld = require('jsonld')
  , N3 = require('n3')
  , N3Util = N3.Util;

/**
 * parse triples into valid RDF
 *
 * @parseTriples 
 * @function
 * @param {Object} triples The triples array that will be parsed
 * @param {Object} triples The prefixes used to expand the IRIs
 * @param {Function} callback The callback function.
 */
exports.parseTriples = function (triples, prefixes, callback) {

    if (typeof prefixes === 'function') {
        callback = prefixes;
        prefixes = {};
    }

    triples.forEach(function (triple) {

        /* subject */
        // expand prefixes
        if (N3Util.isPrefixedName(triple.subject)) {
            triple.subject = N3Util.expandPrefixedName(triple.subject, prefixes);
        }

        /* predicate */

        // expand prefixes
        if (N3Util.isPrefixedName(triple.predicate)) {
            triple.predicate = N3Util.expandPrefixedName(triple.predicate, prefixes);
        }

        /* object */

        if (!N3Util.isPrefixedName(triple.object) && !N3Util.isBlank(triple.object.toString()) && !N3Util.isLiteral(triple.object)) {
            triple.object = N3Util.createLiteral(triple.object);
        } else if (N3Util.isPrefixedName(triple.object)) {
            triple.object = N3Util.expandPrefixedName(triple.object, prefixes);
        }
    });

    callback(null, triples);
};