# hyperdrive-index

index changes to a [hyperdrive][1] feed

[1]: https://npmjs.com/package/hyperdrive

# example

This example indexes the number of lines in each file written to hyperdrive.

``` js
var level = require('level')
var hyperdrive = require('hyperdrive')
var sub = require('subleveldown')
var through = require('through2')
var split = require('split2')
var hdex = require('hyperdrive-index')

var db = level('/tmp/drive.db')
var ndb = sub(db, 'lines', { valueEncoding: 'json' })

var drive = hyperdrive(sub(db, 'drive'))
var link = process.argv[4] ? Buffer(process.argv[4], 'hex') : null
var archive = drive.createArchive(link, { live: true })
if (!link) console.log(archive.key.toString('hex'))

var dex = hdex({
  archive: archive,
  db: level('/tmp/drive.dex.db'),
  map: function (entry, cb) {
    var stream = archive.createFileReadStream(entry)
    countLines(stream, function (err, lines) {
      if (err) cb(err)
      else ndb.put(entry.name, lines, cb)
    })
  }
})

var name = process.argv[3]
if (process.argv[2] === 'add') {
  process.stdin.pipe(archive.createFileWriteStream(name))
} else if (process.argv[2] === 'get') {
  dex.ready(function () {
    ndb.get(name, function (err, lines) {
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
$ echo -ne 'one\ntwo\nthree' | node dex.js add hello.txt
54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
$ echo -ne 'wheee' | node dex.js add what.txt \
  54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
$ node dex.js get what.txt \
  54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
1
$ node dex.js get hello.txt \
  54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
3
$ echo -ne 'one\ntwo\nthree\nfour\nfive' | node dex.js add hello.txt \
  54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
$ node dex.js get hello.txt \
  54df0239eed2035ad486c990c130cc32d5898d72543d263c9f0385f812a10767
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
