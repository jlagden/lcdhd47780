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

		self.displaySplashScreen();
		self.logger.info('[lcdHD47780] LCD Ready COLS=' + COLS + 'ROWS=' + ROWS + 'RS=' + RS + 'E=' + E +
						 'D4=' + D4 + 'D5=' + D5 + 'D6=' + D6 + 'D7=' + D7);
  	});
}			

lcdDisplay.prototype.displaySplashScreen = function() {
	
	var self = this;
	
	self.logger.info('[lcdhd47780] Displaying splash screen');
	
	self.lcd.clear(function (err) {
	
		self.lcd.print('Volumio 2',function (err) {
			
			self.lcd.setCursor(0,1);
			self.lcd.print('Music Player',function (err) {		
			});
	
		});
	});
	
};

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
	
	// TODO: Needs some redesign.
	// If the state has just been pushed, we should update the LCD straight away
	// rather than wait for the next interval
	
	// Also we should be resetting the scrollPos if the track/title has changed
	
	var self = this;
	if(self.displayTimer === undefined){
		self.displayTimer = setInterval( self.updateLCD.bind(self),SCROLL_SPEED);
		self.logger.info('[lcdHD47780] Set up display Timer');
	}
	self.logger.info('[lcdHD47780] Recieved pushstate');
	self.elapsed = state.seek;

	self.currentState = state; // Update state
	self.logger.info('[lcdHD47780] Processed pushstate');
  
};

lcdDisplay.prototype.updateLCD = function() {
	
	var self = this;
	self.logger.info('[lcdHD47780] Updating LCD');

	if(self.currentState!==undefined) {
	
		// Track Information
		
		var trackInfo = self._formatTrackInfo(self.currentState);
		
		if (self.scrollPos >= trackInfo.length)
			self.scrollPos = 0; // Reset scroll
		
		trackInfo = self._formatTextForScrolling(trackInfo,self.scrollPos,COLS);

		// Source / Elapsed / Duration
		
		var duration = self.currentState.duration;

		// If it's a WebRadio then don't show elapsed/duration 
		var elapsedInfo = (self.currentState.service==='webradio') ? 
								self._padEnd('WebRadio',COLS) : 
								self._formatSeekDuration(self.elapsed,duration);
		
		self.lcd.setCursor(0,0);
	
		// Print track info
		self.lcd.print(trackInfo,function (err) {
			
			self.scrollPos++; // Advance scroll position

			// Track info printed ok, set lets print elapsed / duration
			self.lcd.setCursor(0,1);
			self.lcd.print(elapsedInfo,function (err) {
				
				if (self.currentState.status === 'play') 
	  	    		self.elapsed += SCROLL_SPEED; // Advanced elapsed if playing
				
			});
		});

	}
};	

// In some cases (webradio) only the artist or the title is actually populated
// so we need to check what is populated
// Also if we don't have that info or we aren't playing / paused then just display
// a placeholder
// data (current state)

lcdDisplay.prototype._formatTrackInfo = function(data) {
	
	var self = this;
	var txt = "";
	if(!data.artist && !data.title) { // TODO: Check this, would we want to display uri in this case?
		txt = 'No track data';
	} else {
		if (data.artist)
			txt = data.artist;
		if(data.title) 
			txt += txt ? (' - ' + data.title) : data.title;
	}
	
	// If the text length is less than or equal to the lcd width then
	// just pad with spaces and don't scroll
	if(txt.length <= COLS) 
		txt += (' ').repeat(COLS - txt.length);
	else 
		txt += (' ').repeat(COLS/2); // Add some spaces so it doesn't look naff if it's scrolling
	
	return txt;	
	
};

// Take in the track info, scroll position and width of the lcd and 
// return the text to display
// trackInfo (Track name / artist)
// pos (current scroll position)
// lcdWidth (character width of lcd)
	
lcdDisplay.prototype._formatTextForScrolling = function(trackInfo,pos,lcdWidth){	
	
	if (trackInfo.length==lcdWidth)
		return trackInfo;
	else
		return ((trackInfo.substr(pos) + trackInfo.substr(0, pos)).substr(0,lcdWidth));
	
};

// Formats the seek and duration into a text format suitable for display
// seek (seek time in milliseconds)
// duration (duration time in seconds)

lcdDisplay.prototype._formatSeekDuration = function(seek, duration) { 

	var self = this;
	
	var seekSec = Math.floor(seek / 1000); // convert seek to seconds
	var seekMin = Math.floor(seekSec / 60); // calculate whole seek minutes
	seekSec = seekSec - (seekMin * 60); // remaining seconds 
   
	seekMin = seekMin % 100; // only two digits for minutes, so wrap back to 0 once we hit 100 
	
	if (seekMin < 10) (seekMin = "0" + seekMin); // pad minutes
	if (seekSec < 10) (seekSec = "0" + seekSec); // pad seconds
	 
	var txt = seekMin + ":" + seekSec;
	
	if (duration) {
		
		var durMin = Math.floor(duration / 60); // calculate whole duration minutes
		var durSec = duration % 60; // remaining seconds
		
		durMin = durMin % 100; // only two digits for minutes, so wrap back to 0 once we hit 100
		
		if (durMin < 10)  (durMin = "0" + durMin); // pad minutes
  		if (durSec < 10)  (durSec = "0" + durSec); // pad seconds
		
 		txt+= " / " + durMin + ":" + durSec; // add duration to display
		
	}

	return self._padEnd(txt,COLS); 

};

// Volumio runs on a version of Node that doesn't support padEnd, so just use our own implementation
// string (string to pad)
// length (string length to pad to)

lcdDisplay.prototype._padEnd = function(string,length) {
	
	if(string.length>=length) 
		return string;	
	else 
		return (string + " ".repeat(length - string.length));
	
};
