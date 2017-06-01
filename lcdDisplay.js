'use strict';

var COLS = 16;
var ROWS = 2;
var SCROLL_SPEED = 500;

var Lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context) {
	var self = this;
	
	self.displayTimer = undefined;
	self.currentState = undefined;
	self.elapsed = 0;

	self.context = context;
	self.logger = self.context.logger;

	// Test GPIO pins, eventually get this from configuration
	self.lcd = new Lcd({rs: 8, e: 7, data: [25, 24, 23, 18], cols: 16, rows: 2});
};

lcdDisplay.prototype.close = function() {
	var self = this;
	if (self.displayTimer !== undefined) {
		clearTimeout(self.displayTimer);
	}
	self.lcd.close();
};

lcdDisplay.prototype.endOfSong = function() {
	var self = this;

	if (self.displayTimer !== undefined) {
		clearTimeout(self.displayTimer);
		self.displayTimer = undefined;
	}	
	self.lcd.clear();
}

lcdDisplay.prototype.pushState = function(state)  {
	var self = this;

	// Received pushState event
	self.elapsed = state.seek;
	if (state.status === 'play') {		
		if (self._needStartDisplayInfo(state)) { // Clear the timeout and start displayInfo again
			clearTimeout(self.displayTimer);
			self.lcd.clear();
			self.displayTrackInfo(state, 0);
		}
	}
	else if (state.status === 'stop') { // Now stopped, clear the timeout and display
		self.elapsed = 0;
		clearTimeout(self.displayTimer);
		self.lcd.clear();
	}
	else if (state.status === 'pause') {
		self.elapsed = state.seek; // Update elapsed
	}
	self.currentState = state; // Update state
}

lcdDisplay.prototype.displayTrackInfo = function(data,pos) {
	var self = this;

	var duration = data.duration;
	
	if (self.elapsed >= duration * 1000) {
		self.endOfSong();
	} else {
	
		var trackInfo = data.artist + '-' + data.title;
		if (trackInfo.length > COLS) {
			// Piece the string together in such a way so it constantly scrolling
			trackInfo = trackInfo + '          ' + trackInfo.substr(0, COLS);
		} else { // If the length is les then the display width, we just need to display it and forget about scrolling
			// Add spaces to fill up the rest of the display
			trackInfo = trackInfo + (' ').repeat(COLS-trackInfo.length);
		}
	
		// Reset position
		if (pos >= trackInfo.length - COLS) {
	    		pos = 0;
		}
	
		self.lcd.setCursor(0,0);
		// Print track info
		self.lcd.print(trackInfo.substr(pos,COLS),function (err) {
			// Track info printed ok, set lets print elapsed / duration
			self.lcd.setCursor(0,1);
			self.lcd.print(self._formatSeekDuration(self.elapsed,duration),function (err) {
				self.displayTimer = setTimeout(function () {
					if (self.currentState.status != 'pause')
	  	    				self.elapsed += SCROLL_SPEED;
					self.displayTrackInfo(data, pos + 1);
				},SCROLL_SPEED);
			});
		});
	}

}

// If we have started playing or the artist/track has changed we need
// to restart displayInfo		 
		       
lcdDisplay.prototype._needStartDisplayInfo = function(state) {

	var self = this;
  	return  ((state.status === 'play' && self.currentState.status === 'stop') ||
        	self.currentState.artist !== state.artist || 
  	  	  	self.currentState.title !== state.title);
}
		       
lcdDisplay.prototype._formatSeekDuration = function(seek, duration) {
		
	// Seek is in millisec, duration in sec
	return _msToMinSec(seek) + ' / ' + _sToMinSec(duration);

}

lcdDisplay.prototype._msToMinSec = function(msec) {
	var min = (msec / (1000 * 60)) << 0;
	var sec = (msec / 1000) % 60;
	
	return((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);

}

lcdDisplay.prototype._sToMinSec = function(sec) {
	var min = (sec /60) << 0;
	var sec = (sec % 60);

	return((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);
}
