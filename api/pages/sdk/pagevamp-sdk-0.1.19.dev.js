(function() {
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
})();
(function() {
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
	
	window.meanEngine = new meanEngine();
})();(function() {
	window.meanEngine.set('api', {
		protocol:	"http",
		hostname:	"127.0.0.1",
		port:		5000
	});
	
	// Create the module
	window.meanEngine.set('app', angular.module('main', []));
	
	// The component manager
	var pagevampComponentManager = function() {
		this.components 		= [];
	}
	pagevampComponentManager.prototype.register = function(component) {
		this.components.push(component);
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
		var component	= getComponentById('id');
		if (!component) {
			return false;
		}
		return component.data.cdnPath;
	}
	pagevampComponentManager.prototype.getTemplateFor = function(id) {
		var component	= getComponentById('id');
		if (!component) {
			return false;
		}
		return component.data.template;
	}
	window.meanEngine.set('components', new pagevampComponentManager());
	
	
	
	// The head and body sections
	// Developers don't have direct access to the controlers, only to their own directives/components, 
	// which are childs of the controler.
	window.meanEngine.get('app').controller('head', function ($scope) {
		$scope.title = "Default title";
	});
	window.meanEngine.get('app').controller('body', function ($scope) {
		$scope.components = [{
			directive:	'header01'
		},{
			directive:	'content01'
		},{
			directive:	'content01'
		},{
			directive:	'content01'
		},{
			directive:	'content01'
		},{
			directive:	'content01'
		},{
			directive:	'content01'
		}]
	});
})();
window.meanEngine.get('app').directive('componentLoader', function($compile) {
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