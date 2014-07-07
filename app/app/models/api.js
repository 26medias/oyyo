(function() {
	
	// Protects views where angular is not loaded from errors
	if ( typeof angular == 'undefined' ) {
		return;
	};
	
	var IP 		= "10.8.104.136";
	var PORT 	= 5000;
	
	var module = angular.module('ApiModel', []);

	module.factory('api', function($http) {
		
		return {
			execute: function(endpoint, params, callback) {
				
				params.callback = 'JSON_CALLBACK';
				var i;
				var qs = [];
				for (i in params) {
					qs.push(i+'='+escape(params[i]));
				}
				
				var promise = $http.jsonp("http://"+IP+":"+PORT+"/api/"+endpoint+"/jsonp?"+qs.join('&')).then(function(response) {
					data = response.data;
					if (data.error) {
						alert(data.error.message);
						return false;
					} else {
						return data;
					}
				});
				return promise;
			}
		};
		
	});
})();
