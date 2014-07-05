var _ 					= require('underscore');
var qs 					= require("querystring");
var toolset 			= require("toolset");

// Users
function api() {
	
}
api.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	this.datacache = new toolset.cache();
	
	// Return the methods
	var methods = {
		
		get: {
			require:		['path'],
			auth:			false,
			description:	"Grab and return a component's file",
			params:			{path:"Path on the CDN"},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				//@todo: cache!
				scope.datacache.fetch(new Buffer(params.path, 'base64').toString('ascii'), callback);
			}
		}
	};
	
	// Init a connection
	this.mongo	= new this.Gamify.mongo({database:Gamify.settings.db});
	this.mongo.init(function() {
		callback(methods);
	});
}
exports.api = api;