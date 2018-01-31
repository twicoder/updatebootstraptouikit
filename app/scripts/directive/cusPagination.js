'use strict';

angular.module('ocspApp')
.directive('ocspPagination', function () {
    return {
        scope: {
            tableData: '=ngModel'
        },
        restrict:'AE',
        require: '^ngModel',
        priority: 200000,
        replace: true,
        link: function (scope, elem, attrs) {
            scope.pageSize = [];
            for(var i=0;i<attrs.totalpages;i++){
                scope.pageSize.push(i+1);
            }
        },
        controller:function($scope,$rootScope){
            $rootScope.currentPage = 1;
            $scope.turnToPage = function(pageNumber){
                console.log('try to turn to page:',pageNumber);
                $rootScope.currentPage = pageNumber;
                $scope.tableData.page(pageNumber);
            };
        },
        template:
        `
        <nav>
            <ul class="pagination" ng-repeat="n in pageSize track by $index">
                <li class="page-item">
                    <a class="page-link" ng-click="turnToPage(n)" href="">{{n}}</a>
                </li>
            </ul>
        </nav>
        `
    };
});