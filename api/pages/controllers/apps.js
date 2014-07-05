var _ 					= require('underscore');
var qs 					= require("querystring");

// Users
function page() {
	
}
page.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	// Return the methods
	var paths = {
		
		'/apps': {
			require:		[],
			auth:			'passport',
			description:	"Prototype",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				// It's searching in /pages/views/, our demo is in /pages/components
				Gamify.render("pages/views/site/apps/index.html", {
					user: 			req.user,
					title:			"My Apps",
					dependencies:	['theme','MeanEngine']
				}, function(rendered) {
					callback(rendered);
				}, Gamify, res, req);
				
			}
		},
		'/sites': {
			require:		[],
			auth:			'passport',
			description:	"Prototype",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				// It's searching in /pages/views/, our demo is in /pages/components
				Gamify.render("pages/views/site/apps/sites.html", {
					user: 			req.user,
					title:			"My Sites",
					dependencies:	['theme','MeanEngine']
				}, function(rendered) {
					callback(rendered);
				}, Gamify, res, req);
				
			}
		}
	};
	
	// Init a connection
	this.mongo	= new this.Gamify.mongo({database:Gamify.settings.db});
	this.mongo.init(function() {
		callback(paths);
	});
}
exports.page = page;