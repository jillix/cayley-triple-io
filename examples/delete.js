var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});

var readStream = client.createReadStream([ 'builder:someInstance' ]);
var deleteStream = client.createDeleteStream();

readStream.on('error', function (err) {
    console.log(err);
});
deleteStream.on('error', function (err) {
    console.log(err);
});

deleteStream.on('success', function () {
    console.log('Triples deleted.');
});

readStream.pipe(deleteStream);