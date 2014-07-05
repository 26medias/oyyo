

var loginApp = angular.module('loginApp', ['LoginModel', 'ngTouch']);

// Index: http://localhost/views/login/index.html

loginApp.controller('IndexCtrl', function ($scope, LoginRestangular) {
	
	$scope.connected = false;

	$scope.facebookLogin = function() {
		
		return steroids.addons.facebook.login({
			scope: 'email'
		}).then(function() {
			return $scope.$apply(function() {
				return $scope.connected = true;
			});
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
	
	// Native navigation
	steroids.view.navigationBar.show("Facebook");
	steroids.view.setBackgroundColor("#76C339");
	
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
