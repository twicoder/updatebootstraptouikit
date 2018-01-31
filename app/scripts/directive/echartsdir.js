'use strict';

var app = angular.module('ocspApp');

app.directive('eChart', function() {
    function link($scope, element, attrs) {
        var myChart = echarts.init(element[0]);
        $scope.$watch(attrs.eData, function() {
            var option = $scope.$eval(attrs.eData);
            if (angular.isObject(option)) {
                myChart.setOption(option);
            }
        }, true);
        $scope.getDom = function() {
            return {
                'height': element[0].offsetHeight,
                'width': element[0].offsetWidth
            };
        };
        $scope.$watch($scope.getDom, function() {
            // resize echarts图表
            myChart.resize();
        }, true);

        myChart.on('click',function(params){
            if(attrs.clicked){
                $scope.$eval(attrs.clicked)(params);
            }
            // $scope.clicked(params);
        });
    }
    return {
        restrict: 'A',
        link: link
    };
});
