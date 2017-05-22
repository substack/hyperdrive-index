var level = require('level')
var hyperdrive = require('hyperdrive')
var through = require('through2')
var split = require('split2')
var hdex = require('../')

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
