var _ 					= require('underscore');
var qs 					= require("querystring");
var toolset 			= require("toolset");

// Users
function api() {
	
}
api.prototype.init = function(Gamify, callback){
	var scope = this;
	
	this.Gamify = Gamify;
	
	// Return the methods
	var methods = {
		
		list: {
			require:		[],
			auth:			'apikey',
			description:	"List the user's websites (proto)",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.find({
					collection:	'sites',
					query:		{
						uid:	params.__auth
					}
				}, function(sites) {
					
					// List the IDS
					var siteids = [];
					_.each(sites, function(site) {
						siteids.push(site.id);
					});
					
					// List the pages
					scope.mongo.find({
						collection:	'pages',
						query:		{
							site:	{
								$in:	siteids
							}
						}
					}, function(pages) {
						
						// Index by site ID
						var indexed = _.groupBy(pages, 'site');
						
						// Inject into the site objects
						sites = _.map(sites, function(site) {
							site.pages = indexed[site.id] || [];
							return site;
						});
						callback(sites);
					});
					
					
				});
			}
		},
		create: {
			require:		[],
			auth:			'apikey',
			description:	"Create a new blank website (proto)",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.insert({
					collection:	'sites',
					data:		{
						id:		toolset.crypto.uuid(),
						uid:	params.__auth,
						name:	"[untitled]",
						theme:	false
					}
				}, function(err, response) {
					callback(response);
				});
			}
		},
		remove: {
			require:		['id'],
			auth:			'apikey',
			description:	"Delete a site (proto)",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.remove({
					collection:	'sites',
					data:		{
						id:		params.id,
						uid:	params.__auth
					}
				}, function(err, response) {
					callback({
						removed: true
					});
				});
			}
		},
		save: {
			require:		['id'],
			auth:			'apikey',
			description:	"Update a site's data",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.update({
					collection:	'sites',
					query:	{
						id:		params.id,
						uid:	params.__auth
					},
					data:		{
						$set:	params.data
					}
				}, function(err) {
					callback({
						saved:	true
					});
				});
			}
		},
		savePage: {
			require:		['id'],
			auth:			'apikey',
			description:	"Update a page's data",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.update({
					collection:	'pages',
					query:	{
						id:		params.id,
						uid:	params.__auth
					},
					data:		{
						$set:	params.data
					}
				}, function(err) {
					callback({
						saved:	true
					});
				});
			}
		},
		updateComponents: {
			require:		['id','components'],
			auth:			'apikey',
			description:	"Update a page's components",
			params:			{},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				// Make sure every component has a unique ID (to avoid duplicate error in Angular)
				params.components = _.map(params.components, function(component) {
					if (!component.uuid) {
						component.uuid	= toolset.crypto.uuid();
					}
					if (!component.data) {
						component.data	= [];
					}
					return component;
				});
				
				scope.mongo.update({
					collection:	'pages',
					query:	{
						id:		params.id,
						uid:	params.__auth
					},
					data:		{
						$set:	{
							components:	params.components
						}
					}
				}, function(err) {
					callback({
						pushed:	true
					});
				});
			}
		},
		createPage: {
			require:		['site'],
			auth:			'apikey',
			description:	"Create a new blank page (proto)",
			params:			{id:'Page ID'},
			status:			'stable',
			version:		1,
			callback:		function(params, req, res, callback) {
				
				scope.mongo.insert({
					collection:	'pages',
					data:		{
						id:			toolset.crypto.uuid(),
						title:		'[untitled]',
						components:	[],
						site:		params.site,
						uid:		params.__auth
					}
				}, function(err, response) {
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