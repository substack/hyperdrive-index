var sub = require('subleveldown')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var through = require('through2')

var INFO = 'i', LOG = 'l'

module.exports = Dex
inherits(Dex, EventEmitter)

function Dex (opts) {
  var self = this
  if (!(self instanceof Dex)) return new Dex(opts)
  EventEmitter.call(self)
  var map = opts.map
  var archive = opts.archive
  var db = sub(opts.db, INFO, { valueEncoding: 'json' })
  self._pending = 1

  db.get('offset', function (err, offset) {
    nonlive(offset || 0, function (err, noffset) {
      if (err) return self.emit('error', err)
      else live(noffset)
    })
  })
  function nonlive (offset, cb) {
    archive.list({ offset: offset, live: false }, onlist)
    function onlist (err, entries) {
      if (err) return cb(err)
      var files = {}
      entries.forEach(function (e) { files[e.name] = e })
      var keys = Object.keys(files)
      ;(function next (err) {
        if (err) return cb(err)
        if (keys.length === 0) return cb(null, offset)
        var key = keys.shift()
        map(files[key], function (err) {
          if (err) return cb(err)
          db.put('offset', ++offset, next)
        })
      })()
    }
  }
  function live (offset) {
    process.nextTick(function () {
      if (--self._pending === 0) self.emit('_ready')
    })
    var r = archive.list({ offset: offset, live: true })
    var stream = through.obj(function (entry, enc, next) {
      self._pending++
      map(entry, function (err) {
        if (err) next(err)
        else db.put('offset', ++offset, function (err) {
          if (err) return next(err)
          process.nextTick(function () {
            if (--self._pending === 0) self.emit('_ready')
          })
          next()
        })
      })
    })
    r.on('error', onerror)
    stream.on('error', onerror)
    r.pipe(stream)
    function onerror (err) { self.emit('error', err) }
  }
}

Dex.prototype.ready = function (fn) {
  var self = this
  if (self._pending === 0) {
    process.nextTick(function () {
      if (self._pending === 0) {
        fn()
      } else self.once('_ready', fn)
    })
  } else self.once('_ready', fn)
}
