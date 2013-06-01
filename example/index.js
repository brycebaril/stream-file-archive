var rotator = require("../")({
  path: "logs/foo-%h-%M-%S.log",
  symlink: "logs/current.log",
  compress: true
})

var Readable = require("stream").Readable

if (!Readable) {
  Readable = require("readable-stream/readable")
}

var Throttle = require("throttle")

// Slow things down to provide a useful example
// NOTE: throttle breaks apart the buffers such that they aren't cohesive lines anymore
var throttle = new Throttle(1024)

var util = require("util")

function Rand() {
  if (!(this instanceof Rand)) return new Rand()
  Readable.call(this)
}
util.inherits(Rand, Readable)

var c = 0
Rand.prototype._read = function (size) {
  if (c >= 200) return this.push(null)
  this.push((new Date()).toString() + " " + (++c).toString() + "\n")
}

Rand().pipe(throttle).pipe(rotator)