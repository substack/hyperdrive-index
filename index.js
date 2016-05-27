var sub = require('subleveldown')

var INFO = 'i', LOG = 'l'

module.exports = Dex

function Dex (opts) {
  if (!(this instanceof Dex)) return new Dex(opts)
  var map = opts.map
  var archive = opts.archive
  this.infodb = sub(opts.db, INFO)

  archive.list(function (err, entries) {
    console.log(entries)
  })
}

Dex.prototype.ready = function (fn) {
  //...
}
