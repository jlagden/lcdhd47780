'use strict'

var COLS = 16;
var ROWS = 2;
var SCROLL_SPEED = 300;

var lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context) {

	// Test GPIO pins, eventually get this from configuration
	this.lcd = new Lcd({rs: 7, e: 8, data: [25, 24, 23, 18], cols: 16, rows: 2});

}

lcdDisplay.prototype.displayTrackInfo = function(data,pos) {

	pos = pos || 0;
	var trackInfo = data.artist + '-' + data.title;
	var duration = data.duration;
	
	if (trackInfo.length > COLS) {
	} else { // If the length is les then the display width, we just need to display it and forget about scrolling
		// Add spaces to fill up the rest of the display
		trackInfo = trackInfo + (' ').repeat(COLS-trackInfo.length);
	}
	
	this.lcd.setCursor(0,0);
	this.lcd.print(trackInfo.substr(pos,COLS),function (err) {
		if (err) {
			throw err;
		}
		// Track info printed ok, set lets print elapsed / duration
		this.lcd.setCursor(0,1);
		this.lcd.print(this._formatSeekDuration(,duration),function (err) {
			if (err) {
				throw err;
			}
			setTimeout(function () {
				this.displayTrackInfo(str, pos + 1);
			},SCROLL_SPEED);
		}
	});

}

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) {
	return _msToMinSec(seek) + ' / ' + _msToMinSec(duration);

}

lcdDisplay.prototype._msToMinSec = function(msec) {
	var min = (msec / (1000 * 60)) << 0;
	var sec = (msec / 1000) % 60;
	
	return((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);

}
