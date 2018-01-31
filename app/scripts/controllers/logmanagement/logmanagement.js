'use strict';

/**
 * For log management main page controller
 */
angular.module('ocspApp')
    .controller('LogManagementCtrl', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
        $rootScope.init('logmanagement');
        $scope.lang = $rootScope.lang;
        $scope.logfiles = [];

        function init() {
            $http.get('/api/actionlog').success(function (data) {
                $scope.logfiles = data;
            });
        }

        init();

    }]);
