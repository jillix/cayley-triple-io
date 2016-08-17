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
    [
        'builder:someInstance',
        'schema:name',
        'someInstance'
    ],
    [
        'builder:someInstance',
        'flow:config',
        '_:bn1'
    ],
    [
        '_:bn1',
        'schema:name',
        'someName'
    ],
    [
        '_:bn1',
        'schema:age',
        123
    ]
];

var stream = client.create();

stream.on('error', function (err) {
    console.log(err);
});

stream.on('finish', function () {
    console.log('create finished');
});

for (var i = 0; i < triples.length - 1; ++i) {
    stream.write(triples[i]);
}
stream.end(triples[triples.length - 1]);