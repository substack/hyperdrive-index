var memdb = require('memdb')
var mem = require('random-access-memory')
var hyperdrive = require('hyperdrive')
var test = require('tape')

var through = require('through2')
var split = require('split2')
var hdex = require('../')

test('dex', function (t) {
  t.plan(6)
  var db = memdb({ valueEncoding: 'json' })
  var archive = hyperdrive(mem)
  var dex = hdex({
    archive: archive,
    db: memdb(),
    map: function (entry, cb) {
      var ch = archive.checkout(entry.version)
      var stream = ch.createReadStream(entry.name)
      countLines(stream, function (err, lines) {
        if (err) cb(err)
        else db.put(entry.name, lines, cb)
      })
    }
  })
  var pending = 2
  archive.createWriteStream('/hello.txt')
    .once('finish', done)
    .end('one\ntwo\nthree')
  archive.createWriteStream('/cool.txt')
    .once('finish', done)
    .end('beep\nboop')

  function done () {
    if (--pending !== 0) return
    dex.ready(ready)
  }
  function ready () {
    db.get('/hello.txt', function (err, n) {
      t.error(err)
      t.equal(n, 3)
    })
    db.get('/cool.txt', function (err, n) {
      t.error(err)
      t.equal(n, 2)
      archive.createWriteStream('/cool.txt')
        .once('finish', check2)
        .end('beep\nboop\nwhatever\nzzz')
    })
  }
  function check2 () {
    dex.ready(function () {
      db.get('/cool.txt', function (err, n) {
        t.error(err)
        t.equal(n, 4)
      })
    })
  }
})

function countLines (stream, cb) {
  var n = 0
  stream.pipe(split()).pipe(through(write, end))
  function write (buf, enc, next) { n++; next() }
  function end (next) { cb(null, n) }
}
