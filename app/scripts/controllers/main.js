'use strict';

/**
 * @ngdoc function
 * @name ocspApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ocspApp
 */
angular.module('ocspApp')
  .controller('MainCtrl',['$scope', '$location', '$rootScope', 'hotkeys','$http', function ($scope, $location, $rootScope, hotkeys,$http) {
    if($rootScope.getUsername()){
      if($rootScope.isAdmin()) {
        $location.path("/dashboard");
      }else{
        $location.path("/task_management");
      }
    }

    $scope.login = function(){
      if($scope.user.pass !== undefined) {
        $http.get("/api/config/cepEnable").success((data) => {
          $rootScope.cep = JSON.parse(data);
          $rootScope.login($scope.user.name, $scope.user.pass);
        });
      }
    };

    hotkeys.bindTo($scope).add({
      combo: 'enter',
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function() {
        $scope.login();
      }
    });

}]);
