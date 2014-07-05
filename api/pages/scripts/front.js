window.meanEngine.get('app').controller('menuCtrl', function ($scope) {
	
	// Default header and menu
	
	if (!userData || !userData._id) {
		$scope.header = {
			title:	'Developers@Pagevamp',
			menu:	[{
				label:	'Quick login',
				url:	'/auth/facebook'
			}],
			menuRight:	[{
				label:	'Login',
				url:	'/account/login'
			}]
		}
	} else {
		$scope.header = {
			title:	'Developers@Pagevamp',
			menu:	[{
				label:	'Manage',
				url:	'/manage'
			}],
			menuRight:	[{
				label:	'My Apps',
				url:	'/apps'
			},{
				label:	'My Sites',
				url:	'/sites'
			},{
				label:	'Logout',
				url:	'/logout'
			}]
		}
	}
});