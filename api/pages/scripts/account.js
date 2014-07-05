window.meanEngine.get('app').controller('headerCtrl', function ($scope) {
	$scope.user = userData;
});

window.meanEngine.get('app').controller('sidebarCtrl', function ($scope) {
	
	$scope.user = userData;
	$scope.sidebar = {
		title:	'Survey',
		menu:	[{
			label:	'Manage',
			url:	'/manage'
		}],
		menuRight:	[{
			label:	'Account',
			items:	[{
				label:	'Profile',
				url:	'account/profile.html'
			},{
				label:	'Update my account',
				url:	'account/edit.html'
			},{
				label:	'Logout',
				url:	'account/logout.html'
			}]
		}]
	}
	
	console.log("$scope.sidebar",$scope.sidebar);
});