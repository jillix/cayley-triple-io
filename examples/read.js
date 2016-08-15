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
		true,
		['In', 'flow:server']
	], {}, function (err, triples) {

	if (err) {
		throw err;
	}

	console.log(JSON.stringify(triples, null, 2));
});