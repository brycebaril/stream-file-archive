module.exports = FileArchive

var Transform = require("stream").Transform

if (!Transform) {
  Transform = require("readable-stream/transform")
}

var fs = require("fs")
var path_module = require("path")
var mkdir = require("mkdirp")
var strftime = require("ultra-strftime")
var util = require("util")
var zlib = require("zlib")
var xtend = require("xtend")

var ROOT_PATH_RE = /^\//;//unix root
if (/^win/.test(process.platform)) {//is windows
  ROOT_PATH_RE = /^[a-zA-Z]\:\\/;//win root
}

var DEFAULTS = {
  path: "out.log",
  compress: false,
}

// Date
// %Y 4-digit year
// %m month (01..12)
// %d day of month (01..31)
// %x iso8601 date portion (e.g. 2012-09-24)
// Time
// %h hour (00..23)
// %M minute (00..59)
// %S second (00..61)
// %X iso8601 time portion to the second (e.g.: 15:12:47)
// %I iso8601 date/time to the second (e.g. 2012-09-24T15:12:47)

// NOTE: date/time substitutions only work on "path" not "symlink" paths.

// symlink: "/path/too/link" // -> current log file
// compress: true // -> compress files once finished writing

function FileArchive(config) {
  if (!(this instanceof FileArchive)) return new FileArchive(config)
  Transform.call(this)
  this.cwd = process.cwd()

  var options = xtend(DEFAULTS, config)

  // TBD should check for bad filenames somewhere
  this.symlink = ""
  if (options.symlink) {
    this.symlink = options.symlink
    if (!ROOT_PATH_RE.exec(this.symlink)) {
      this.symlink = path_module.join(this.cwd, this.symlink)
    }
  }
  this.path_config = options.path
  this.compress = options.compress

  var self = this
  process.on("SIGHUP", function () {self.renew(true)})

  this.path = this.current_name()
  this.refcount = 0

  this.renew(true)
}
util.inherits(FileArchive, Transform)

FileArchive.prototype._transform = function (chunk, encoding, cb) {
  this.renew()
  this.push(chunk)
  cb()
}

FileArchive.prototype._done = function () {
  this.refcount--
  if (this.refcount <= 0) {
    this.emit("done")
  }
}

FileArchive.prototype.renew = function (force) {
  var self = this
  var current_name = this.current_name()
  if (force || current_name !== this.path) {
    var old_path = this.path
    this.path = current_name
    var old_stream = this.stream
    mkpath(this.path)

    this.refcount++
    var newstream = fs.createWriteStream(this.path, {flags: "a", encoding: "utf8"})
    this.unpipe(this.stream)

    newstream.once("finish", this._done.bind(this))

    this.pipe(newstream)
    this.stream = newstream

    if (this.symlink) {
      mkpath(this.symlink)
      fs.unlink(this.symlink, function () {
        fs.symlink(self.path, self.symlink, function () {
          // TODO anything need to be done here?
        })
      })
    }
    if (old_stream && this.compress) {
      old_stream.on("close", function () {
        self.archive(old_path)
      })
    }
    if (old_stream && old_stream.writable) old_stream.destroySoon()
  }
}

function mkpath(path) {
  if (path.match(/\//)) {
    var path_array = path.split("/")
    // TBD use async?
    mkdir.sync(path_array.splice(0, path_array.length-1).join("/"))
  }
}

FileArchive.prototype.archive = function (path) {
  var self = this
  var inp = fs.createReadStream(path)
  var out = fs.createWriteStream(path + ".gz")
  inp.on("end", function () {
    fs.unlink(path, function(err) {})
    self._done()
  })
  inp.pipe(zlib.createGzip()).pipe(out)
}

FileArchive.prototype.current_name = function () {
  if (this.path && this.path_config.indexOf("%") === -1)
    return this.path

  var d = new Date()
  var path = strftime(this.path_config, d)

  // Moving this to initialization would gain some perf, but it would break
  // the ability to have the first part of the path be a date part to substitute
  if (!ROOT_PATH_RE.exec(path)) {
    path = path_module.join(this.cwd, path)
  }
  return path
}
