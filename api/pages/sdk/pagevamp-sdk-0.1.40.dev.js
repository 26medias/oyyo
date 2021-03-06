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
			console.log("Retroactive inform: ",type, data);
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
	MeanEngine
	This is the "engine", managing communciation across modules, sharing namespaces, get/set, ...
	it also comes with a few utilities built-in.
*/
(function(window, document) {
	meanEngine = function() {
		this.settings 		= {};
		this.services 		= {};
		this.version		= "alpha-1.0";
		this._cookiePrefix 	= "meanEngine_";
		this._jsonPrefix 	= "__JSON__";
	};
	meanEngine.prototype.init = function() {
		
	};
	meanEngine.prototype.set = function(name, data, persist) {
		this.settings[name] = data;
		if (persist) {
			// Also save as a cookie, with a prefix
			this.setCookie(this._cookiePrefix+name, data, 365);
		}
	};
	meanEngine.prototype.unset = function(name) {
		if (this.settings[name]) {
			delete this.settings[name];
		}
		if (this.getCookie(this._cookiePrefix+name)) {
			this.setCookie(this._cookiePrefix+name, null, -1);
		}
		return true;
	};
	meanEngine.prototype.get = function(name) {
		if (this.settings[name]) {
			return this.settings[name];
		} else if (this.getCookie(this._cookiePrefix+name)) {
			return this.getCookie(this._cookiePrefix+name);
		}
		return false;
	};
	meanEngine.prototype.service = function(name, callback) {
		if (callback) {
			this.services[name] = callback();
		} else {
			return this.services[name];
		}
	};
	meanEngine.prototype.setCookie = function(name,value,days) {
		
		// encode JSON if required
		if (typeof value != "string" && typeof value != "number") {
			value = this._jsonPrefix+JSON.stringify(value);
		}
		
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		} else{
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/;";
		return true;
	};
	meanEngine.prototype.getCookie = function(name) {
		
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0){
				var cookieValue = c.substring(nameEQ.length,c.length);
				// Now we decode if required
				if (cookieValue.substr(0, this._jsonPrefix.length) == this._jsonPrefix) {
					cookieValue = JSON.parse(cookieValue.substr(this._jsonPrefix.length));
				}
				return cookieValue;
			}
		}
		return null;
	};
	meanEngine.prototype.dom = function(nodeType, appendTo, raw) {
		var element = document.createElement(nodeType);
		if (appendTo != undefined) {
			$(appendTo).append($(element));
		}
		return (raw === true)?element:$(element);
	};
	
	window.meanEngine = new meanEngine();
})(window, document);/*
	Init
	This code inits the MeanEngine, decode the global data provided by the rendered, and init the Angular App.
*/
(function(meanEngine) {
	meanEngine.set('api', {
		protocol:	"http",
		hostname:	"127.0.0.1",
		port:		5000
	});
	
	meanEngine.set('site', {
		data:	JSON.parse(window.atob(window.pagevampSiteData())),
		page:	JSON.parse(window.atob(window.pagevampPageData())),
	});
	
	// Create the module
	meanEngine.set('app', angular.module('main', []));
	
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
				var jsFilename = scope.registeredId[id].data.cdnPath+'/'+scope.registeredId[id].data.directive;
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
						console.log("Emitting Arbiter event...");
						window.Arbiter.inform('pvsdk.components.loaded', scope.components, true);	// true->retroactive event
					}
					
				});
			})(id);
		}
		
	}
	pagevampComponentManager.prototype.getComponentById = function(id) {
		var i;
		var l = this.components.length;
		for (i=0;i<l;i++) {
			if (this.components[i].id == id) {
				return this.components[i];
			}
		}
		return false;
	}
	pagevampComponentManager.prototype.getCdnPath = function(id) {
		var component	= this.getComponentById('id');
		if (!component) {
			return false;
		}
		return component.data.cdnPath;
	}
	pagevampComponentManager.prototype.getTemplateFor = function(id) {
		var component	= this.getComponentById('id');
		if (!component) {
			return false;
		}
		return component.data.template;
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
	var components = meanEngine.get('site').page.components;
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
	// The head and body sections
	meanEngine.get('app').controller('head', function ($scope) {
		$scope.title = "Default title";
	});
	
	meanEngine.get('app').controller('body', function ($scope) {
		
		window.Arbiter.subscribe('pvsdk.components.loaded', function(components) {
			console.log("Arbiter event received!",components);
		});
		
		
		$scope.components = [];
	});
})(window.meanEngine);/*
	Ng-loader
	This is the actual component loader.
	It loads and include the components on the page.
	It is a directive that loads other directives.
*/
(function(meanEngine) {
	meanEngine.get('app').directive('componentLoader', function($compile) {
		var component = function(scope, element, attrs) {
			
			scope.$watchCollection('components', function(a, b) {
				var code = '';
				var i;
				for (i=0;i<scope.components.length;i++) {
					code += '<div '+scope.components[i].directive+'></div>'
				}
				element.html($compile(code)(scope));
				
			});
			
		}
	
		return {
			link: 			component,
			scope:			true
		};
	});
})(window.meanEngine);