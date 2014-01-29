var test = require("tape").test

var fs = require("fs")
var rimraf = require("rimraf")
var spigot = require("stream-spigot")

var SFA = require("../")

test("simple", function (t) {
  var default_sfa = SFA()
  var input = spigot(["my\n", "dear\n", "aunt\n", "sally\n"])

  input.pipe(default_sfa)

  default_sfa.on("done", function () {
    var stats = {}
    try {
      stats = fs.statSync("./out.log")
    } catch (e) {
      t.fail("Failed to stat default out.log file")
    }
    t.equals(stats.size, 19, "file length is correct")
    rimraf("./out.log", function () {
      t.end()
    })
  })
})

test("symlink", function (t) {
  var linkPath = "/tmp/sfa_tests/symlink/out.link"
  var logPath = "/tmp/sfa_tests/symlink/out.log"

  var symlink_sfa = SFA({symlink: linkPath, path: logPath})
  var input = spigot(["my\n", "dear\n", "aunt\n", "sally\n"])

  input.pipe(symlink_sfa)

  symlink_sfa.on("done", function () {
    fs.stat(logPath, function (err, stats) {
      t.notOk(err, "stat check should not error")
      var linkTo = ""
      try {
        var linkTo = fs.readlinkSync(linkPath)
      } catch (e) {
        t.fail("failed to stat symlink")
      }
      t.equals(linkTo, logPath, "symlink points to log file")
      t.equals(stats.size, 19, "file length is correct")
      rimraf("/tmp/sfa_tests/symlink", function () {
        t.end()
      })
    })
  })
})

test("compress", function (t) {
  var logDir = "/tmp/sfa_tests/compress/"
  var logPath = logDir + "out%S.log"

  var sfa = SFA({compress: true, path: logPath})

  sfa.write("my\n")
  sfa.write("dear\n")
  setTimeout(function () {
    sfa.write("aunt\n")
    sfa.write("sally\n")
  }, 1001)

  sfa.on("done", function () {
    fs.readdir(logDir, function (err, files) {
      t.notOk(err, "Error on readdir")
      t.ok(files.length == 2 || files.length == 3, "should be 2 (or 3 in rare cases) files")
      files.sort(function (a, b) {
        return b.length - a.length
      })
      t.ok(/^out\d\d\.log\.gz$/.test(files[0]), "first file should be a .gz")
      t.ok(/^out\d\d\.log$/.test(files[files.length - 1]), "last file should be a .log")
      rimraf(logDir, function () {
        t.end()
      })
    })
  })
})

test("cleanup", function (t) {
  rimraf("/tmp/sfa_tests/", function () {
    t.ok("cleaned up.")
    t.end()
  })
})