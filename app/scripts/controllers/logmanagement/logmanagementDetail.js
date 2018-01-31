'use strict';

/**
 * For log management main page controller
 */
angular.module('ocspApp')
    .controller('LogManagementDetailCtrl', ['$scope', '$http', '$rootScope', '$uibModal', '$routeParams', function ($scope, $http, $rootScope, $uibModal, $routeParams) {
        $rootScope.init('logmanagement');
        $scope.lang = $rootScope.lang;
        $scope.logFileRecords = [];
        $scope.logFileName = $routeParams.logFileName;

        function init() {
            $http.get('/api/actionlog/' + $scope.logFileName).success(function (data) {
                $scope.logFileRecords = data;
                $scope.logFileRecords.forEach((item)=>{
                    item.MethodName = $scope.lang === 'zh' ? item.userActionMethodCnName : item.userActionMethodEnName;
                });
            });
        }

        init();

        $scope.checkUserDataDetail = (data) => {
            let modal = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title-bottom',
                ariaDescribedBy: 'modal-body-bottom',
                templateUrl: 'UserActionDataDetail.html',
                size: 'lg',
                backdrop: 'static',
                scope: $scope,
                controller: ['$scope', function ($scope) {
                    $scope.userData = JSON.parse(data);
                    $scope.closeModal = function () {
                        modal.close();
                    };
                }]
            });
        };

    }]);
