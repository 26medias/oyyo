window.meanEngine.get('app').directive('header02', function() {
	var component = function(scope, element, attrs) {
		scope.title = "My websites";
	}

	return {
		link: 			component,
		replace:		true,
		scope:			true,
		templateUrl:	'components/header02/component.html'
	};
});