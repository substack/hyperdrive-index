var level = require('level')
var hyperdrive = require('hyperdrive')
var sub = require('subleveldown')
var through = require('through2')
var split = require('split2')
var hdex = require('../')

var db = level('/tmp/drive.db')
var ndb = sub(db, 'lines', { valueEncoding: 'json' })

var drive = hyperdrive(sub(db, 'drive'))
var dex = hdex({
  drive: drive,
  db: level('/tmp/drive.dex.db'),
  map: function (entry, stream, cb) {
    countLines(stream, function (err, lines) {
      if (err) cb(err)
      else ndb.put(entry.name, lines, cb)
    })
  }
})

var name = process.argv[2]
process.stdin.pipe(drive.createFileWriteStream(name))

dex.ready(function () {
  ndb.get(name, function (err, lines) {
    if (err) console.error(err)
    else console.log(lines)
  })
})

function countLines (stream, cb) {
  var n = 0
  stream.pipe(split()).pipe(through(write, end))
  function write (buf, enc, next) { n++; next() }
  function end (next) { cb(null, n) }
}
