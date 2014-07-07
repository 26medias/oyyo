var dashboardApp = angular.module('dashboardApp', ['ApiModel', 'ngTouch']);

// Index: http://localhost/views/dashboard/index.html

dashboardApp.controller('IndexCtrl', function ($scope, api) {
	
	alert(screen.width+' ; '+screen.height);
	
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
	$scope.friends 		= [];
	
	
	$scope.message = function(friend, positive) {
		api.execute('messages/send',{
			fbuid:			localStorage.getItem("fbuid"),
			secret:			localStorage.getItem("secret"),
			to:				friend.fbuid,
			type:			positive?'positive':'negative'
		}).then(function(data) {
			alert(JSON.stringify(data));
		});
	}
	
	// List the user's friends
	api.execute('friends/list',{
		fbuid:			localStorage.getItem("fbuid"),
		secret:			localStorage.getItem("secret")
	}).then(function(data) {
		
		if (!data) {
			
			alert("Looks like we got an error!");
			
		} else {
			
			$scope.safeApply(function() {
				$scope.friends 		= data;
				$scope.loading 		= false;
			});
		}
		
	});
});