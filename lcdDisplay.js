'use strict'

var COLS = 16;
var ROWS = 2;

var lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context) {

	// Test GPIO pins, eventually get this from configuration
	self.lcd = new Lcd({rs: 7, e: 8, data: [25, 24, 23, 18], cols: 16, rows: 2});

}

lcdDisplay.prototype.displayTrackInfo = function(data,pos) {

	pos = pos || 0;
	
	if(pos === str.length){
		pos = 0;
	}
	
	lcd.print(data[pos],function (err) {
		if (err) {
			throw err;
		}
		
		setTimeout(function () {
			this.displayTrackInfo(str, pos + 1);
		},300);
	};

}

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) {
	return _msToMinSec(seek) + ' / ' + _msToMinSec(duration);

}

lcdDisplay.prototype._msToMinSec = function(msec) {
	var min = (msec / (1000 * 60)) << 0;
	var sec = (msec / 1000) % 60;
	
	return((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);

}
