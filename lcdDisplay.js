'use strict';

var COLS,ROWS,RS,E,D4,D5,D6,D7;
var SCROLL_SPEED = 500;

var Lcd = require('lcd');

module.exports = lcdDisplay;

function lcdDisplay(context,config) {
  
	var self = this;
	
	self.displayTimer = undefined;
	self.currentState = undefined;
	self.scrollPos = 0;
	
	self.elapsed = 0;

	// Set up logger
	self.context = context;
	self.logger = self.context.logger;
	
	// Get configuration parameters
	COLS = config.get('COLS');	ROWS = config.get('ROWS');
	RS = config.get('RS');		E = config.get('E');
	D4 = config.get('D4');		D5 = config.get('D5');
	D6 = config.get('D6');		D7 = config.get('D7');

	self.lcd = new Lcd({rs: RS, e: E, data: [D4, D5, D6, D7], cols: COLS, rows: ROWS});

	// Handle any errors we forget about so they don't crash Node
	self.lcd.on('error',function(err) {
		self.logger.error('[lcdHD47780] LCD Error: ' + err);
	});
	self.lcd.on('ready',function() {
		self.displayTimer = setInterval(self.updateLCD,SCROLL_SPEED);
		self.logger.info('[lcdHD47780] LCD Ready COLS={$COLS} ROWS={$ROWS} RS={$RS} E={$E} D4={$D4} D5={$D5} D6={$D6} D7={$D7}');
  	});
}				  

lcdDisplay.prototype.close = function() {
  
	var self = this;
	if (self.displayTimer !== undefined) {
		clearInterval(self.displayTimer);
	}
	// Clear first before close so everything is tidy
	self.lcd.clear(function(err) {
		if(err) {
			self.logger.error('[lcdHD47780] LCD Error: ' + err);
		}
		else {
			self.lcd.close();
		}
	});
  
};

lcdDisplay.prototype.pushState = function(state)  {
	
	var self = this;
	self.logger.info('[lcdHD47780] Recieved pushstate');
	self.elapsed = state.seek;

	self.currentState = state; // Update state
	self.logger.info('[lcdHD47780] Processed pushstate');
  
};

lcdDisplay.prototype.updateLCD = function() {
	
	var self = this;
	var pos = self.scrollPos;
	var duration = self.currentState.duration;
	
	var trackInfo = self._formatTrackInfo(self.currentState);
	
	if (pos >= trackInfo.length) {
		pos = 0;
	}
	
	trackInfo = self._formatTextForScrolling(trackInfo,pos,COLS);
	
	self.lcd.setCursor(0,0);
	
	// Print track info
	self.lcd.print(trackInfo,function (err) {
		// Track info printed ok, set lets print elapsed / duration
		self.lcd.setCursor(0,1);
		self.lcd.print(self._formatSeekDuration(self.elapsed,duration),function (err) {
			if (self.currentState.status === 'play')
	  	    	self.elapsed += SCROLL_SPEED;
			self.scrollPos++;
		});
	});
};	

// If we have started playing or the artist/track has changed we need
// to restart displayInfo		 
		       
lcdDisplay.prototype._needStartDisplayInfo = function(state) {

	var self = this;
  	return  ((state.status === 'play' && self.currentState.status === 'stop') ||
    	self.currentState.artist !== state.artist || 
  		self.currentState.title !== state.title);
  
};

// In some cases (eg. radio station) only the artist or the title is actually populated
// so we need to check what is populated
// Also if we don't have that info or we aren't playing / paused then just display
// a placeholder

lcdDisplay.prototype._formatTrackInfo = function(data) {
	
	var txt;
	if((data.status !== 'play' && data.status !== 'pause') || (!data.artist && !data.title)) {
		txt = 'Volumio';
	} else {
		if (data.artist)
			txt = data.artist;
		if(data.title) 
			txt += txt ? ` - ${data.title}` : data.title;
	}
	
	// If the text length is less than or equal to the lcd width then
	// just pad with spaces and don't scroll
	if(txt.length <= COLS) {
		txt += (' ').repeat(COLS - txt.length);
	} else {
		// Add some spaces so it doesn't look naff if it's scrolling
		txt += (' ').repeat(COLS/2);
	}
	
	return txt;
	
};
	
// Take in the track info, scroll position and width of the lcd and 
// return the text to display
	
lcdDisplay.prototype._formatTextForScrolling = function(trackInfo,pos,lcdWidth){	
		
	return ((trackInfo.substr(pos) + trackInfo.substr(0, pos)).substr(0,lcdWidth));
	
};

// Formats the seek and duration into a text format suitable for display
// seek (seek time in milliseconds)
// duration (duration time in seconds)

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) { 

	var txt;
	
	var seekSec = Math.floor(seek / 1000); // convert seek to seconds
	var seekMin = Math.floor(seekSec / 60); // calculate whole seek minutes
	seekSec = seekSec - (seekMin * 60); // remaining seconds 
   
	seekMin = seekMin % 100; // only two digits for minutes, so wrap back to 0 once we hit 100 
	
	if (seekMin < 10) (seekMin = "0" + seekMin); // pad minutes
	if (seekSec < 10) (seekSec = "0" + seekSec); // pad seconds
	 
	txt = seekMin + ":" + seekSec;
	
	if (duration) {
		
		var durMin = Math.floor(duration / 60); // calculate whole duration minutes
		var durSec = duration % 60; // remaining seconds
		
		durMin = durMin % 100; // only two digits for minutes, so wrap back to 0 once we hit 100
		
		if (durMin < 10)  (durMin = "0" + durMin); // pad minutes
  		if (durSec < 10)  (durSec = "0" + durSec); // pad seconds
		
 		txt+= " / " + durMin + ":" + durSec; // add duration to display
		
	}

	return txt; 

};
