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
		
		get: {
			require:		[],
			auth:			'apikey',
			description:	"Get a component data",
			params:			{id:"Widget ID"},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.find({
					collection:	'components',
					query:		{
						uid:		params.__auth
					}
				}, function(response) {
					callback(response);
				});
			}
		},
		list: {
			require:		[],
			auth:			false,
			description:	"Remove a widget",
			params:			{id:"Widget ID"},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.find({
					collection:	'components',
					query:		{}
				}, function(response) {
					callback(response);
				});
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