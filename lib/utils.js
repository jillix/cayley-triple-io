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
 * parse triple into valid RDF
 *
 * @parseTriple
 * @function
 * @param {Object} triples The triples array that will be parsed
 */
exports.parseTriple = function (chunk) {

    // chunk must be array
    if (!(chunk instanceof Array) || chunk.length !== 3) {
        return new Error('Invalid data chunk format: Data chunk must be an array.');
    }

    // build triple from chunk
    var triple = {
        subject: chunk[0],
        predicate: chunk[1],
        object: chunk[2]
    }

    // values must be strings
    if (typeof triple.subject !== 'string' || typeof triple.predicate !== 'string' || typeof triple.object !== 'string') {
        return new Error('Invalid data chunk format: All values must be strings.');
    }

    // subject and predicate must not be a literal
    if (N3Util.isLiteral(triple.subject) || N3Util.isLiteral(triple.predicate)) {
        return new Error('Invalid data chunk format: Subject and predicate must not be literals.');
    }

    return triple;
};

/**
 * parse value into valid RDF
 *
 * @parseValue
 * @function
 * @param {Object} value The value that will be parsed
 * @param {Object} prefises The prefixes used to expand the IRIs
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