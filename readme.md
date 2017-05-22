# hyperdrive-index

index changes to a [hyperdrive][1] feed

Use this package to generate indexes to quickly answer questions about files
written to hyperdrive. For example, you could create an index that parses exif
headers and generates thumbnails for a p2p photo album served over a hyperdrive.

[1]: https://npmjs.com/package/hyperdrive

# example

This example indexes the number of lines in each file written to hyperdrive.

``` js
var level = require('level')
var hyperdrive = require('hyperdrive')
var through = require('through2')
var split = require('split2')
var hdex = require('hyperdrive-index')

var db = level('/tmp/drive.db')
var archive = hyperdrive('/tmp/drive.data')

var dex = hdex({
  archive: archive,
  db: level('/tmp/drive.dex.db'),
  map: function (entry, cb) {
    var ch = archive.checkout(entry.version)
    var stream = ch.createReadStream(entry.name)
    countLines(stream, function (err, lines) {
      if (err) cb(err)
      else db.put(entry.name, lines, cb)
    })
  }
})

var name = process.argv[3]
if (process.argv[2] === 'add') {
  process.stdin.pipe(archive.createWriteStream(name))
} else if (process.argv[2] === 'get') {
  dex.ready(function () {
    db.get(name, function (err, lines) {
      if (err) console.error(err)
      else console.log(lines)
    })
  })
}

function countLines (stream, cb) {
  var n = 0
  stream.pipe(split()).pipe(through(write, end))
  function write (buf, enc, next) { n++; next() }
  function end (next) { cb(null, n) }
}
```

---

```
$ echo -ne 'one\ntwo\nthree' | node dex.js add /hello.txt
$ echo -ne 'wheee' | node dex.js add /what.txt
$ node dex.js get /what.txt
1
$ node dex.js get /hello.txt
3
$ echo -ne 'one\ntwo\nthree\nfour\nfive' | node dex.js add /hello.txt
$ node dex.js get /hello.txt
5
```

# api

``` js
var hindex = require('hyperdrive-index')
```

## var dex = hindex(opts)

Create a hyperdrive index `dex` from:

* `opts.archive` - [hyperdrive][1] archive opened in live mode
* `opts.db` - [leveldb][2] instance
* `opts.map(entry, cb)` - function to process each new entry object

In your `opts.map(entry, cb)` function, write your indexes to some persistent
storage and call `cb(err)` when finished. The `entry` records are metadata
objects, like you get from `archive.list()`.

[2]: https://npmjs.com/package/level

## dex.ready(fn)

`fn()` fires when the indexes are caught up with the latest known value in the
hyperdrive feed.

# install

```
npm install hyperdrive-index
```

# license

BSD
