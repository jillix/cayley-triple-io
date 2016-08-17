var tripleCrud = require('../index.js');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});

var stream = client.read([ 'builder:someInstance' ]);
var deleteStream = client.delete();

stream.on('error', function (err) {
    console.log(err);
});

var data = [];
stream.on('data', function (chunk) {
    data.push(chunk);
});

stream.on('end', function () {
    deleteStream.on('error', function (err) {
        console.log(err);
    });
    deleteStream.on('finish', function () {
        console.log('delete finished');
    });

    for (var i = 0; i < data.length - 1; ++i) {
        deleteStream.write(data[i]);
    }
    deleteStream.end(data[data.length - 1]);
});