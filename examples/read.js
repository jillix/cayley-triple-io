var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});

var stream = client.createReadStream(
    [
        'builder:someInstance',
    ]);

stream.on('error', function (err) {
    console.log(err);
});

stream.on('data', function (chunk) {
    console.log(chunk);
});