window.meanEngine.get('app').directive('content01', function() {
	var component = function(scope, element, attrs) {
		
	}

	return {
		link: 			component,
		replace:		true,
		scope:			true,
		templateUrl:	'components/content01/component.html'
	};
});