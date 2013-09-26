stream-file-archive
===================

[![NPM](https://nodei.co/npm/stream-file-archive.png)](https://nodei.co/npm/stream-file-archive/)

[![david-dm](https://david-dm.org/brycebaril/stream-file-archive.png)](https://david-dm.org/brycebaril/stream-file-archive/)
[![david-dm](https://david-dm.org/brycebaril/stream-file-archive/dev-status.png)](https://david-dm.org/brycebaril/stream-file-archive#info=devDependencies/)

Easy log rotation for Node.js

Supports:
  * Output your logs to time-rotated log files.
  * Optionally gzip the logs once they are no longer current
  * Optionally maintain a symlink to the currently active log file
  * Native Streams2 (0.10.x+) with backwards compatibility

Can directly plug into [smart-tee](http://npm.im/smart-tee), e.g.:

```
node foo.js 2>&1 | smart-tee --s stdout --s stream-file-archive --path logs/app-%Y-%m-%d.log
```

Usage:
======

```javascript
var rotator = require("stream-file-archive")({
  path: "logs/app-%Y-%m-%d.log",  // Write logs rotated by the day
  symlink: "logs/current.log",    // Maintain a symlink called current.log
  compress: true,                 // Gzip old log files
})

my_logger_thingy.pipe(rotator)
```

Options
=======

path
----

A string file path with any of the below options to define rotation schedule:

e.g. `logs/mylog-%Y-%m-%d.log` would result in logs like `logs/mylog-2013-06-01.log`

  * %Y 4-digit year e.g. 2013
  * %m month (01..12)
  * %d day of month (01..31)
  * %x iso8601 date portion (e.g. 2012-09-24)
  * %h hour (00..23)
  * %M minute (00..59)
  * %S second (00..61)
  * %X iso8601 time portion to the second (e.g.: 15:12:47)
  * %I iso8601 date/time to the second (e.g. 2012-09-24T15:12:47)

symlink
-------

A path to a symlink that will be maintained to point at the current log file.

compress
--------

Boolean value, whether to gzip the files once they aren't being written to.

NOTES:
======

*Currently only timestamps files in UTC timezone.* Pull requests welcome!

LICENSE
=======

MIT