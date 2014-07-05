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
		
		
		'/': {
			require:		[],
			auth:			false,
			description:	"Homepage",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				Gamify.render("pages/views/site/index.html", {
					user: 	req.user,
					title:	"Pagevamp Prototype",
					dependencies:	['theme','MeanEngine']
				}, function(rendered) {
					callback(rendered);
				}, Gamify, res, req);
				
			}
		},
		'/welcome': {
			require:		[],
			auth:			"passport",
			description:	"Homepage",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				Gamify.render("pages/views/site/welcome.html", {
					user: 	req.user,
					title:	"Pagevamp Prototype",
					dependencies:	['theme','MeanEngine','starter-pack']
				}, function(rendered) {
					callback(rendered);
				}, Gamify, res, req);
				
			}
		},
	};
	
	// Init a connection
	this.mongo	= new this.Gamify.mongo({database:Gamify.settings.db});
	this.mongo.init(function() {
		callback(paths);
	});
}
exports.page = page;