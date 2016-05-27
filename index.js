var hyperlog = require('hyperlog')
var hindex = require('hyperlog-index')
var sub = require('subleveldown')

var DEX = 'd', LOG = 'l'

module.exports = Dex

function Dex (opts) {
  if (!(this instanceof Dex)) return new Dex(opts)
  this.drive = opts.drive
  var map = opts.map
  this.log = hyperlog(sub(opts.db, LOG))
  this.dex = hindex({
    log: this.log,
    db: sub(opts.db, DEX),
    map: function (block, next) {
      drive.metadata.get(block, function (err, entry) {
        if (err) next(err)
        else map(entry, next)
      })
    }
  })
}

Dex.prototype.ready = function (fn) {
  this.dex.ready(fn)
}
