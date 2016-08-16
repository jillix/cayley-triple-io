var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});

client.read(
    [
        'someInstance',
        ['In', 'schema:name']
    ], function (err, triples) {

    if (err) {
        throw err;
    }

    if (!triples) {
        throw new Error('No triples.');
    }

    client.delete(triples, function (err, res) {

        if (err) {
            throw err;
        }

        console.log(res);
    });
});