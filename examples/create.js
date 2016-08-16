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
        predicate: 'flow:config',
        object: '_:bn1'
    },
    {
        subject: '_:bn1',
        predicate: 'schema:name',
        object: 'someName'
    },
    {
        subject: '_:bn1',
        predicate: 'schema:age',
        object: 123
    }
];

client.create(triples, function (err, res) {
    console.log(err, res);
});