var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/'
});

var triples = [
    [
        'http://service.jillix.com/jillix/service/app/builder/someInstance',
        'http://schema.org/name',
        '"someInstance"'
    ],
    [
        'http://service.jillix.com/jillix/service/app/builder/someInstance',
        'http://schema.jillix.net/vocab/config',
        '_:bn1'
    ],
    [
        '_:bn1',
        'http://schema.org/name',
        '"someInstance"'
    ],
    [
        '_:bn1',
        'http://schema.org/age',
        '"22"^^http://www.w3.org/2001/XMLSchema#integer'
    ]
];

var stream = client.createInsertStream();

stream.on('error', function (err) {
    console.log(err);
});

stream.on('success', function () {
    console.log('Triples inserted.');
});

for (var i = 0; i < triples.length - 1; ++i) {
    stream.write(triples[i]);
}
stream.end(triples[triples.length - 1]);