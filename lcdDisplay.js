'use strict'

var lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context) {

	self.lcd = new Lcd({rs: 7, e: 8, data: [25, 24, 23, 18], cols: 16, rows: 2});

}

lcdDisplay.prototype.displayTrackInfo = function(data,index) {


}

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) {
	return _msToMinSec(seek) + ' / ' + _msToMinSec(duration);

}

lcdDisplay.prototype._msToMinSec = function(msec) {
	var min = (msec / (1000 * 60)) << 0;
	var sec = (msec / 1000) % 60;
	
	return((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);

}