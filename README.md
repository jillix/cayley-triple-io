# cayley-triple-io

Insert, Read and Delete triples from Cayley

## Change Log

#### 0.1.0
 - First version.


## Docs

### Class: client
Creates a new Client instance

**options**: `Object` , Constructor options.

**options.url**: `String` , Cayley host url.

**options.prefixes**: `Object` , An object with RDF prefixes.

#### example

``` javascript
var tripleCrud = require('cayley-triple-io');
var client = new tripleCrud.Client({
    url: 'http://localhost:64210/',
    prefixes: {
        builder: 'http://service.jillix.com/jillix/service/app/builder/',
        schema: 'http://schema.org/',
        flow: 'http://schema.jillix.net/vocab/'
    }
});
```

### client.createInsertStream(options, options.bufferSize) 

Inserts triples into cayley

**Parameters**

**options**: `Object`, Object containing stream options.

**options.bufferSize**: `Number`, The number of triples that will be colected in the internal buffer before writing to cayley. Default is 10.

**Returns**: writable stream

**Events**

`error` - Will be called if an error is encountered while inserting the triple. **Note** the stream will not end if an error happens, all the triples written before and after the error will be inserted into cayley.

`success` - Will be called after all triples have been inserted.

#### example
``` javascript
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
```

### client.createReadStream(query, options, options.deep, options.out) 

reads triples from cayley

**Parameters**

**query**: `Object`, The cayley query that will be used to find the start node.

**options**: `Object`, Object containing stream options.

**options.deep**: `Boolean`, If false only the first level endges will be traversed. Default true.

**options.out**: `Array`, An array containing the predicates that will be traversed

**Returns**: readable stream

#### example

``` javascript
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
```

**Query example**

``` javascript
    [
        SOME_VALUE,
        ['In', 'SOME_PREDICATE'],
        ['Out', 'SOME_PREDICATE'],
        ['Is', 'SOME_VALUE'],
        ['Has', ['SOME_PREDICATE', 'SOME_VALUE']]
    ]
```

**options example**
``` javascript
    {
        deep: true,
        out: [
            'predicate_IRI',
            'prefix:predicate',
            ...
        ]
    }
```
***stream data example**
``` javascript
[ 'http://service.jillix.com/jillix/service/app/builder/someInstance', 'http://schema.org/name', '"someInstance"' ]
[ 'http://service.jillix.com/jillix/service/app/builder/someInstance', 'http://schema.jillix.net/vocab/config', '_:bn1' ]
[ '_:bn1', 'http://schema.org/name', '"someInstance"' ]
[ '_:bn1', 'http://schema.org/age', '"22"^^http://www.w3.org/2001/XMLSchema#integer' ]
```

### client.createDeleteStream(options, options.bufferSize) 

deletes triples from cayley

**Parameters**

**options**: `Object`, Object containing stream options.

**options.bufferSize**: `Number`, The number of triples that will be colected in the internal buffer before deleting from cayley. Default is 10.

**Returns**: writable stream

**Events**

`error` - Will be called if an error is encountered while deleting the triple. **Note** the stream will not end if an error happens, all the triples written before and after the error will be deleted from cayley.

`success` - Will be called after all triples have been deleted.

#### example
``` javascript
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

var stream = client.createDeleteStream();

stream.on('error', function (err) {
    console.log(err);
});

stream.on('success', function () {
    console.log('Triples deleted.');
});

for (var i = 0; i < triples.length - 1; ++i) {
    stream.write(triples[i]);
}
stream.end(triples[triples.length - 1]);
```
* * *
