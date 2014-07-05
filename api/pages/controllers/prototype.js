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
		
		
		'/prototype': {
			require:		['alias'],
			auth:			false,
			description:	"Prototype",
			params:			{latest:'Bool - Use the latest version', alias:'Alias of the site'},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				
				params	= scope.Gamify.api.fixTypes(params, {
					latest:		'bool'
				});
				
				
				Gamify.data.sites.getByAlias(params.alias, function(site) {
					if (site === false) {
						callback(Gamify.api.ErrorResponse("This site doesn't exist."));
						return false;
					}
					//callback(site);
					Gamify.log("Rendering", site.theme.cdnPath+'/'+site.theme.layout);
					Gamify.render(site.theme.cdnPath+'/'+site.theme.layout, {
						site:	site
					}, function(rendered) {
						callback(rendered);
					}, Gamify, res, req);
				}, params.latest);	// true = use the latest theme, not the one set in the settings
				/*
				// It's searching in /pages/views/, our demo is in /pages/components
				Gamify.render("../components/themes/startup/layout.html", {
					
				}, function(rendered) {
					callback(rendered);
				}, Gamify, res, req);*/
				
			}
		},
		'/prototype/:alias/:mode/*': {
			require:		[],
			auth:			false,
			description:	"Prototype",
			params:			{},
			status:			'dev',
			version:		1.0,
			callback:		function(params, req, res, callback) {
				
				if (params.mode == 'latest') {
					params.latest = true;
				} else {
					params.latest = false;
				}
				
				
				Gamify.data.sites.getPageData({
					alias:	params.alias,
					latest:	params.latest,
					page:	'/'+params['0']
				}, function(data) {
					
					if (params.edit) {
						data.site.edit = true;
					}
					
					Gamify.render(data.site.theme.cdnPath+'/'+data.site.theme.layout, {
						site:		data.site,	// Pass the site data and the page data to the site
						page:		data.page,
						themePath:	data.site.theme.cdnPath
					}, function(rendered) {
						// Return the rendered HTML
						callback(rendered);
					}, Gamify, res, req);
				});
				
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