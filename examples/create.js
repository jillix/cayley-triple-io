var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});

var triples = [
    {
        subject: 'builder:someInstance',
        predicate: 'schema:name',
        object: 'someInstance'
    },
    {
        subject: 'builder:someInstance',
        predicate: 'flow:server',
        object: true
    }
];

client.create(triples, function (err, res) {
    console.log(err, res);
});