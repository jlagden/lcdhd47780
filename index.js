

'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var lcdDisplay = require(./lcdDisplay');

module.exports = ControllerlcdHD47780;

function ControllerlcdHD47780(context) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

ControllerlcdHD47780.prototype.onVolumioStart = function() {
  	//var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	//this.config = new (require('v-conf'))();
	//this.config.loadFile(configFile);
	var self = this;
	self.logger.info("lcdHD47780 initialized");
	return libQ.resolve();
	
}

ControllerlcdHD47780.prototype.onStart = function() {
	var self = this;
	
	self.lcdDisplay = new lcdDisplay(self.context);
	
	self.configFile=self.commandRouter.pluginManager.getConfigurationFile(self.context,'config.json');

        self.logger.info("lcdHD47780 started");


	
	return libQ.resolve();
};

ControllerlcdHD47780.prototype.onStop = function() {
	var self = this;
	
	self.lcdDisplay.close();
	
	return libQ.resolve();
	
}


ControllerlcdHD47780.prototype.getConf = function(varName) {

      var self = this;

      this.config = new (require('v-conf'))()

      this.config.loadFile(configFile)



      return libQ.resolve();

};

ControllerlcdHD47780.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

ControllerlcdHD47780.prototype.getUIConfig = function() {
	var defer = libQ.defer();
	var self = this;
	
	var lang_code = self.commandRouter.sharedVars.get('language_code');

        self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',

            __dirname+'/i18n/strings_en.json',

            __dirname + '/UIConfig.json')

        .then(function(uiconf) {

            defer.resolve(uiconf);

        })

        .fail(function(){

            defer.reject(new Error());

        });
	
	return defer.promise;

}

ControllerlcdHD47780.prototype.setUIConfig = function(data) {

      var self = this;

      self.logger.info("Updating UI config");

      var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');



      return libQ.resolve();

};

ControllerlcdHD47780.prototype.pushState = function(state) {
	var self = this;
	self.raspdacDisplay.pushState(state);
	return libQ.resolve();

}

// Public Methods
