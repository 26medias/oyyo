(function(window) {
	function ArbiterClass() {
		this.events = new Object();	// events (event based data access and communication)
		this.offers = new Object();	// offers (public-anytime data access)
		this.retroactiveList = {};
	};
	ArbiterClass.prototype.subscribe = function(type, callback) {
		if (this.events[type] == null) {
			this.events[type] = new Array();
		}
		var token = Math.round(Math.random()*100000)+"-"+Math.round(Math.random()*100000);
		this.events[type].push({
			callback: 	callback,
			token:		token
		});
		
		// Was there a retroactive call?
		if (this.retroactiveList[type]) {
			// Re-inform
			this.inform(type, this.retroactiveList[type]);
		}
		
		return token;
	};
	ArbiterClass.prototype.unsubscribe = function(token) {
		for (var type in this.events) {
			for (var i=0;i<this.events[type].length;i++) {
				if (this.events[type][i].token == token) {
					this.events[type].splice(i,1);
					return true;
				}
			}
		}
		return false;
	};
	ArbiterClass.prototype.inform = function(type, data, retroactive) {
		if (retroactive) {
			this.retroactiveList[type] = data;
		}
		
		if (this.events[type] != null) {
			for (var i=0;i<this.events[type].length;i++) {
				this.events[type][i].callback(data);
			}
			return this.events[type].length;
		} else {
			return false;
		}
	};
	ArbiterClass.prototype.offer = function(type, data) {
		if (this.offers[type] == null) {
			this.offers[type] = new Object();
		}
		var token = Math.round(Math.random()*100000)+"-"+Math.round(Math.random()*100000);
		this.offers[type] = {
			data: 		data,
			token:		token
		};
		return token;
	};
	ArbiterClass.prototype.request = function(type, callback) {
		if (callback != null) {
			callback(this.offers[type].data);
		}
		if (this.offers[type]) {
			return this.offers[type].data;
		}
		return false;
	};
	window.Arbiter = new ArbiterClass();
})(window);
/*
	Init
	This code inits the MeanEngine, decode the global data provided by the rendered, and init the Angular App.
*/
(function(meanEngine) {
	
	// Basic settings
	// Probably not even used anymore
	meanEngine.set('api', {
		protocol:	"http",
		hostname:	"127.0.0.1",
		port:		5000
	});
	
	// Decode the site and page data passed by the renderer and make it available
	meanEngine.set('site', {
		data:	JSON.parse(window.atob(window.pagevampSiteData())),
		page:	JSON.parse(window.atob(window.pagevampPageData())),
	});
	
	
})(window.meanEngine);/*
	Pagevamp Component Manager
	This is the component manager.
	It provides public methods to the components (incl themes), giving them their CDN path and that sort of things.
*/
(function(meanEngine) {
	// The component manager
	var pagevampComponentManager = function() {
		this.components 		= [];
		this.registeredId		= {};
		this.loader				= {
			total:	0,
			count:	0
		};
	}
	
	// External method to register a new component on the page
	pagevampComponentManager.prototype.register = function(component) {
		this.components.push(component);
		if (!this.registeredId[component.id]) {
			this.registeredId[component.id] = {
				data:	component
			};
			this.loader.total++;
		}
	}
	
	// External method to init the components:
	// Load the sccripts, execute the ng-loader
	pagevampComponentManager.prototype.init = function() {
		var scope = this;
		
		var id;
		for (id in this.registeredId) {
			(function(id) {
				// Load the script
				var jsFilename = scope.registeredId[id].data.cdnPath+scope.registeredId[id].data.directive;
				var scriptTag = meanEngine.dom('script', $('body'));
				scriptTag.attr('src', jsFilename);
				scriptTag.bind('load', function() {
					scope.loader.count++;
					var pct = scope.loader.count/scope.loader.total*100;
					console.log("Loading...\t",pct.toFixed(2)+'%');
					
					// This is a not a good solution
					// If one component fails to load, all the other will fail too.
					// @todo: Add an error event exception to substract that component from the list
					if (scope.loader.count == scope.loader.total) {
						// Trigger an Arbiter retroactive event
						// The body controler might not be loaded yet, but it will receive the retroactive event (because of its subscription) and load the directive.
						window.Arbiter.inform('pvsdk.components.loaded', scope.components, true);	// true->retroactive event
					}
					
				});
			})(id);
		}
		
	}
	pagevampComponentManager.prototype.getComponentById = function(id) {
		return this.registeredId[id];
	}
	pagevampComponentManager.prototype.getCdnPath = function(id) {
		var component	= this.getComponentById(id);
		if (!component) {
			return false;
		}
		return component.data.cdnPath;
	}
	pagevampComponentManager.prototype.getDataFor = function(id) {
		var component	= this.getComponentById(id);
		if (!component) {
			return false;
		}
		return component.data;
	}
	pagevampComponentManager.prototype.getTemplateFor = function(id) {
		var component	= this.getComponentById(id);
		if (!component) {
			return false;
		}
		var templateUrl = component.data.cdnPath+component.data.template;
		// Now we encode in base64 and return the proxy url
		return 'http://127.0.0.1:5000/api/ress/get/raw?path='+window.btoa(templateUrl);
	}
	pagevampComponentManager.prototype.getUrlFor = function(url, id) {
		var component	= this.getComponentById(id);
		if (!component) {
			return false;
		}
		var templateUrl = component.data.cdnPath+url;
		// Now we encode in base64 and return the proxy url
		return 'http://127.0.0.1:5000/api/ress/get/raw?path='+window.btoa(templateUrl);
	}
	meanEngine.set('components', new pagevampComponentManager());
})(window.meanEngine);/*
	Pagevamp SDK
	This is the component registration module.
	It gets the site data and register the components, making them available to the controlers,
	so that they can be loaded by the component loader (ng-loader).
*/
(function(meanEngine) {
	
	// Get the components for the current page
	if (meanEngine.get('site').data.layout=='onepage') {
		var components = [];
		var i;
		var j;
		var l = meanEngine.get('site').data.pages.length;
		for (i=0;i<l;i++) {
			for (j=0;j<meanEngine.get('site').data.pages[i].components.length;j++) {
				components.push(meanEngine.get('site').data.pages[i].components[j]);
			}
		}
	} else {
		var components = meanEngine.get('site').page.components;
	}
	console.warn("components for this page:", components);
	
	// Register them
	var i;
	var l = components.length;
	for (i=0;i<l;i++) {
		meanEngine.get('components').register(components[i]);
	}
	
	meanEngine.get('components').init();
	
	
})(window.meanEngine);/*
	Angular Controlers
	Developers don't have direct access to the controlers, only to their own directives/components, 
	which are childs of the controler.
	Theme developers don't have access to the main controlers neither,
	as we want the same exact controlers executed on each site.
*/
(function(meanEngine) {
	
	window.Arbiter.subscribe('pvsdk.components.loaded', function(components) {
		
		// Init the main module
		meanEngine.set('app', angular.module('main', []));
		
		// Define the controlers
		// The head and body sections
		meanEngine.get('app').controller('head', function ($scope) {
			
			// Default title
			$scope.title = "Default title";
			
			// The theme data
			$scope.theme = meanEngine.get('site').data.theme;
			
			// The site data
			$scope.site = meanEngine.get('site').data;
			
			// The current page data
			$scope.page = meanEngine.get('site').page;
		});
		
		meanEngine.get('app').controller('body', function ($scope) {
			
			// The components to load
			$scope.components = components;
			
			// The theme data
			$scope.theme = meanEngine.get('site').data.theme;
			
			// The site data
			$scope.site = meanEngine.get('site').data;
			
			// The current page data
			$scope.page = meanEngine.get('site').page;
		});
		
		// Create the safeApply method
		meanEngine.get('app').run(['$rootScope', function($rootScope) {
			$rootScope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
		}]);
		
		// Load the components
		meanEngine.initComponents(meanEngine.get('app'));
		
		// Bootstrap AngularJS
		angular.bootstrap(document, ['main']);
		
	
	});
	
	
	
	
	
})(window.meanEngine);/*
	Ng-loader
	This is the actual component loader.
	It loads and include the components on the page.
	It is a directive that loads other directives.
*/
(function(meanEngine) {
	meanEngine.registerComponent(function(angularApp) {
		angularApp.directive('componentLoader', function($compile, $injector) {
			var component = function(scope, element, attrs) {
				
				console.info("componentLoader", scope);
				
				scope.$watchCollection('page.components', function(a, b) {
					
					var template	= element.html();
					var domObject 	= $(template);
					
					if (!domObject.get(0)) {
						// If there is no template
						var code = '';
						var i;
						for (i=0;i<scope.page.components.length;i++) {
							// Theme-specific component on the wrong theme? Skip!
							if (scope.page.components[i].link && scope.page.components[i].link != scope.site.theme.id) {
								continue;
							}
							code += '<div '+scope.page.components[i].id+'>Loading '+scope.page.components[i].name+'... Please wait...</div>'
						}
						element.html($compile(code)(scope));
					} else {
						// There is a template
						var code = '';
						var i;
						for (i=0;i<scope.page.components.length;i++) {
							// Theme-specific component on the wrong theme? Skip!
							if (scope.page.components[i].link && scope.page.components[i].link != scope.site.theme.id) {
								continue;
							}
							code += template.replace('[component]', '<div '+scope.page.components[i].id+'>Loading '+scope.page.components[i].name+'... Please wait...</div>');
						}
						element.html($compile(code)(scope));
					}
				});
				
				
			}
		
			return {
				link: 			component,
				scope:			true
			};
		});
	});
})(window.meanEngine);