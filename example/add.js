var level = require('level')
var hyperdrive = require('hyperdrive')
var sub = require('subleveldown')
var through = require('through2')
var split = require('split2')
var hdex = require('../')

var db = level('/tmp/drive.db')
var ndb = sub(db, 'lines', { valueEncoding: 'json' })

var drive = hyperdrive(sub(db, 'drive'))
var link = process.argv[3] ? Buffer(process.argv[3], 'hex') : null
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

var name = process.argv[2]
process.stdin.pipe(archive.createFileWriteStream(name))

function countLines (stream, cb) {
  var n = 0
  stream.pipe(split()).pipe(through(write, end))
  function write (buf, enc, next) { n++; next() }
  function end (next) { cb(null, n) }
}
