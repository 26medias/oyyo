
window.meanEngine.set('api', {
	protocol:	"http",
	hostname:	"127.0.0.1",
	port:		5000
});

window.meanEngine.set('app', angular.module('main', []));

window.meanEngine.get('app').run(['$rootScope', function($rootScope) {
	$rootScope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};
}]);

window.meanEngine.get('app').directive('angularSelect', function($compile) {
	var link = function($scope, element, attrs, ngModel) {
		console.log("angularSelect",element, ngModel);
		/*
		$scope.$watch("ngListValue", function() {
			console.log("ngListValue",$scope.ngListValue);
		});*/
	}
	
	return {
		restrict: 		'A',
		require: 		'?ngModel',
		compile: function (tElement, tAttrs, transclude) {
			console.log(">> angularSelect",tElement);
			tElement.selectpicker();
			return function (scope, element, attrs, ngModel) {
				console.log(">>W>> angularSelect return",ngModel);
				ngModel.$render = function() {
					element.val(ngModel.$viewValue || '').selectpicker('render');
				};
				ngModel.$viewValue = element.val();
			};
		}
	};
});
