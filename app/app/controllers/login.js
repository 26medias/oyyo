var loginApp = angular.module('loginApp', ['ApiModel', 'ngTouch']);

// Index: http://localhost/views/login/index.html

loginApp.controller('IndexCtrl', function ($scope, api) {
	
	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};
	
	$scope.loading 		= true;
	$scope.failed 		= false;
	
	// Check if we were already logged in
	if (localStorage.getItem("fbuid") && localStorage.getItem("secret")) {
		// Try to login
		$scope.loading 		= true;
		
		api.execute('user/authenticate',{
			fbuid:			localStorage.getItem("fbuid"),
			secret:			localStorage.getItem("secret")
		}).then(function(data) {
			
			if (!data || !data.exists) {
				// reset the saved sessions
				localStorage.setItem("fbuid", 	false);
				localStorage.setItem("secret", 	false);
				
				$scope.safeApply(function() {
					$scope.loading 	= false;
				});
				
			} else {
				// Go to the dashboard
				webView = new steroids.views.WebView("/views/dashboard/index.html");
				steroids.layers.push(webView);
			}
			
		});
	} else {
		$scope.loading 		= false;
	}
	
	$scope.facebookLogin = function() {
		$scope.loading 		= true;
		
		return steroids.addons.facebook.login({
			scope: 'email'
		}).then(function(fbdata) {
			$scope.safeApply(function() {
				$scope.profile 	= fbdata;
				$scope.loading 	= false;
			});
			if (fbdata.status == 'connected') {
				// create/update
				api.execute('user/updateOrCreate',{
					fbuid:		fbdata.authResponse.userID,
					fbtoken:	fbdata.authResponse.accessToken
				}).then(function(data) {
					
					// Save the session
					localStorage.setItem("fbuid", 	data.fbuid);
					localStorage.setItem("secret", 	data.secret);
					
					// Go to the dashboard
					webView = new steroids.views.WebView("/views/dashboard/index.html");
					steroids.layers.push(webView);
					
					$scope.safeApply(function() {
						$scope.loading 	= false;
						$scope.failed 	= false;
						
					});
				});
			} else {
				$scope.safeApply(function() {
					$scope.loading 	= false;
					$scope.failed 	= true;
				});
			}
		});
	};
	
	$scope.facebookGraphQuery = function() {
		return steroids.addons.facebook.api.get('/me', {
			fields: 'first_name'
		}).then(function(response) {
			return $scope.$apply(function() {
				return $scope.profile = response;
			});
		});
	};
	
	$scope.testapi = function() {
		/*api.login('test@fleetwit.com','80803666').then(function(data) {
			alert(data);
		});*/
		api.execute('user/findOrCreate',{}).then(function(data) {
			alert(JSON.stringify(data));
		});
	};
	
	// Native navigation
	steroids.view.navigationBar.show("Oyyo login");
	steroids.view.setBackgroundColor("#ffffff");
	
});


// Show: http://localhost/views/login/show.html?id=<id>

loginApp.controller('ShowCtrl', function ($scope, $filter, LoginRestangular) {

	// Fetch all objects from the local JSON (see app/models/login.js)
	LoginRestangular.all('login').getList().then( function(logins) {
		// Then select the one based on the view's id query parameter
		$scope.login = $filter('filter')(logins, {id: steroids.view.params['id']})[0];
	});

	// Native navigation
	steroids.view.navigationBar.show("Login: " + steroids.view.params.id );
	steroids.view.setBackgroundColor("#FFFFFF");

});
