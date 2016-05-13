var fs = require('fs');

var hubSerial = '0000000aaaaaaa0000000';

// var child = exec("cat /proc/cpuinfo |grep Serial|cut -d' ' -f2", function (error, stdout, stderr) {
//
//     if (stderr)
//         logger.warn('using default serial number, due to => ' + stderr);
//     else
//         hubSerial = S(stdout).trim().s;
// });

//var cpuinfo = fs.readFileSync('/proc/cpuinfo', "utf8");
var cpuinfo = fs.readFileSync('cpuinfo', "utf8");

var arrMatches = cpuinfo.match(/^.*Serial\s*:\s*(.*)$/m);
var serial = arrMatches[1];

console.log(cpuinfo);
console.log(arrMatches);
console.log(serial);
