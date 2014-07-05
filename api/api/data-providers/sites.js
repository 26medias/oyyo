var _ 					= require('underscore');
var toolset 			= require("toolset");

exports.dataProvider = function (Gamify) {
	
	Gamify.data.sites = new (function() {
		
		var scope 			= this;
		
		this.flattenVersion	= function(version, safe) {
			return [version.major, version.minor, version.build].join(safe?'_':'.');
		};
		
		
		
		
		this.getPageData = function(options, callback) {
			options = _.extend({
				alias:	'',
				latest:	true,
				page:	'/'
			}, options);
			
			// Get the site data first
			// Not efficient tho, will have to be rewritten for the prod version
			Gamify.data.sites.getByAlias(options.alias, function(site) {
				// Find the requested page
				var returned = false;
				_.each(site.pages, function(page) {
					if (page.path == options.page) {
						callback({
							site:	site,
							page:	page
						});
						returned = true;
						return true;
					}
				});
				if (!returned) {
					callback({
						site:		site,
						page:		site.pages[0],	// Return a default page. Because why not... It's a prototype afterall.
						default:	true
					});
				}
			}, options.latest)
		}
		
		
		this.getByAlias	= function(alias, callback, useLatest) {
			
			scope.mongo.find({
				collection:	'sites',
				query:		{
					alias:	alias
				}
			}, function(sites) {
				if (sites.length == 0) {
					callback(false);
					return false;
				}
				var site = sites[0];
				
				// List the pages
				scope.mongo.find({
					collection:	'pages',
					query:		{
						site:	site.id
					},
					sort:		{
						_id:	1
					}
				}, function(pages) {
					
					
					site.pages = pages || [];
					
					// Process the components
					scope.processComponentData(site, callback, useLatest);
				});
				
				
			});
		};
		
		
		this.processComponentData	= function(siteData, callback, useLatest) {
			// List the widget IDs
			var widgetIds = [];
			_.each(siteData.pages, function(page) {
				_.each(page.components, function(component) {
					widgetIds.push(component.id);
				});
			});
			widgetIds = _.uniq(widgetIds);
			
			var processStack = new Gamify.stack();
			
			// Get the theme data
			processStack.add(function(p, cb) {
				scope.mongo.find({
					collection:		'components',
					query:	{
						type:		'theme',
						id:			siteData.theme.id
					}
				}, function(components) {
					if (components.length == 0) {
						siteData.theme = false;
					} else {
						if (useLatest) {
							siteData.theme = _.extend(components[0].latest, {
								settings: 	siteData.theme.data	// Keep the data!
							});
						} else {
							siteData.theme = _.extend(components[0].versions[siteData.theme.versionSafe], {
								settings: 	siteData.theme.data	// Keep the data!
							});
						}
					}
					cb();
				});
			});
			
			// Now get the data for the widgets
			processStack.add(function(p, cb) {
				scope.mongo.find({
					collection:		'components',
					query:	{
						id:	{
							$in:	widgetIds
						}
					}
				}, function(widgets) {
					// Index by id
					var indexed = _.indexBy(widgets, 'id');
					
					// Update the data for each page
					siteData.pages = _.map(siteData.pages, function(page) {
						page.components = _.map(page.components, function(component) {
							if (indexed[component.id]) {
								// save a copy of the custom data
								var customData 			= component.data;
								
								if (useLatest) {
									var newComponent 		= _.extend({},indexed[component.id].latest);
								} else {
									var newComponent 		= _.extend({},indexed[component.id].versions[component.versionSafe]);
								}
								
								
								newComponent.settings 	= customData;
								return newComponent;
							}
							return false;
						});
						return page;
					});
					
					cb();
				});
			});
			
			processStack.process(function() {
				callback(siteData);
			}, false);
		};
		
		this.mongo	= new Gamify.mongo({database: Gamify.settings.db});
		this.mongo.init(function() {
			
		});
	})();
};