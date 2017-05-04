'use strict'

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
  var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

}

ControllerlcdHD47780.prototype.onStop = function() {

};
