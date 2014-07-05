var testApp = angular.module('testApp', ['TestModel', 'ngTouch']);


// Index: http://localhost/views/test/index.html

testApp.controller('IndexCtrl', function ($scope, TestRestangular) {

  // Helper function for opening new webviews
  $scope.open = function(id) {
    webView = new steroids.views.WebView("/views/test/show.html?id="+id);
    steroids.layers.push(webView);
  };

  // Fetch all objects from the local JSON (see app/models/test.js)
  TestRestangular.all('test').getList().then( function(tests) {
    $scope.tests = tests;
  });

  // Native navigation
  steroids.view.navigationBar.show("Test index");
  steroids.view.setBackgroundColor("#FFFFFF");

});


// Show: http://localhost/views/test/show.html?id=<id>

testApp.controller('ShowCtrl', function ($scope, $filter, TestRestangular) {

  // Fetch all objects from the local JSON (see app/models/test.js)
  TestRestangular.all('test').getList().then( function(tests) {
    // Then select the one based on the view's id query parameter
    $scope.test = $filter('filter')(tests, {id: steroids.view.params['id']})[0];
  });

  // Native navigation
  steroids.view.navigationBar.show("Test: " + steroids.view.params.id );
  steroids.view.setBackgroundColor("#FFFFFF");

});
