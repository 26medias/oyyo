var _ 					= require('underscore');
var qs 					= require("querystring");

// Users
function api() {
	
}
api.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	// Return the methods
	var methods = {
		
		check: {
			require:		['profile'],
			auth:			'sys',
			description:	"Update a user account",
			params:			{profile:"Object"},
			status:			'stable',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				params	= scope.Gamify.api.fixTypes(params, {
					profile:	'object',
				});
				
				params.profile = scope.Gamify.api.fixTypes(params.profile, {
					password:	'md5',
				});
				
				callback({hello:params});
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