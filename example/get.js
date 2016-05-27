var level = require('level')
var hyperdrive = require('hyperdrive')
var sub = require('subleveldown')
var through = require('through2')
var split = require('split2')
var hdex = require('../')

var db = level('/tmp/drive.db')
var ndb = sub(db, 'lines', { valueEncoding: 'json' })

var drive = hyperdrive(sub(db, 'drive'))
var archive = drive.createArchive(process.argv[3])

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
