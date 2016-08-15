// Dependencies
var jsonld = require('jsonld')
  , N3 = require('n3')
  , N3Util = N3.Util;

exports.N3Util = N3Util;

// Constants required
var RDFTYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    RDFLANGSTRING = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
    XSDTYPE = 'http://www.w3.org/2001/XMLSchema#';

/**
 * parse triples into valid RDF
 *
 * @parseTriples 
 * @function
 * @param {Object} triples The triples array that will be parsed
 * @param {Object} prefixes The prefixes used to expand the IRIs
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

/**
 * parse value into valid RDF
 *
 * @parseValue
 * @function
 * @param {Object} value The value that will be parsed
 * @param {Object} prefises The prefixes used to expand the IRIs
 * @param {Function} callback The callback function.
 */
exports.parseValue = function (value, prefixes) {

    prefixes = prefixes || {};

    if (!N3Util.isPrefixedName(value) && !N3Util.isBlank(value.toString()) && !N3Util.isLiteral(value)) {
        value = N3Util.createLiteral(value);
    } else if (N3Util.isPrefixedName(value)) {
        value = N3Util.expandPrefixedName(value, prefixes);
    }

    return value;
}

/**
 * getObjectValue
 * parse triple value
 *
 * @name getObjectValue
 * @function
 * @param {String} object the object of a triple.
 */
exports.getObjectValue = function (object) {
    var TYPES = {
        PLAIN: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral',
        BOOLEAN: XSDTYPE + 'boolean',
        INTEGER: XSDTYPE + 'integer',
        DOUBLE: XSDTYPE + 'double',
        STRING: XSDTYPE + 'string',
    };
    var value = N3Util.getLiteralValue(object);
    var type = N3Util.getLiteralType(object);
    var coerced = {};

    switch (type) {
        case TYPES.STRING:
        case TYPES.PLAIN:
            return value;

        case RDFLANGSTRING:
            return [value, N3Util.getLiteralLanguage(object)]

        case TYPES.INTEGER:
            return parseInt(value, 10);

        case TYPES.DOUBLE:
            return parseFloat(value);

        case TYPES.BOOLEAN:
            if (value === 'true' || value === '1') {
                return true;
            } else if (value === 'false' || value === '0') {
                return false;
            } else {
                return null;
            }

        default:
            return value;
    }
}