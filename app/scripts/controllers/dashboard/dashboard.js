'use strict';

angular.module('ocspApp')
  .controller('DashboardCtrl',['$scope', '$rootScope', '$http', 'Notification', '$filter', ($scope, $rootScope, $http, Notification, $filter)=>{
    $rootScope.init('dashboard', true);

    $scope.chartCurrentBatchUsedTimeOptions = {
      scales: {
        yAxes: [
          {
            id: 'y-axis-currBatchUsedTime',
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    };

    $scope.labels = [
      $filter('translate')('ocsp_web_streams_manage_032'),
      $filter('translate')('ocsp_web_streams_manage_034'),
      $filter('translate')('ocsp_web_streams_manage_044')
    ];
    $http.get('/api/chart/status').success((data)=>{
      $scope.status = data.status;
      $scope.names = data.names;
      $scope.running = [data.running];
      $scope.count = data.count;
      $scope.records = data.records;
      $scope.batchtime = [data.batchtime];
      $scope.mem_storage = data.mem_storage;
      $scope.series1 = [$filter('translate')('ocsp_web_dashboard_reserved'), $filter('translate')('ocsp_web_dashboard_dropped')];
      $scope.series2 = [$filter('translate')('ocsp_web_dashboard_enabled_events'), $filter('translate')('ocsp_web_dashboard_disabled_events')];
      $scope.series3 = [$filter('translate')('ocsp_web_dashboard_memory_used'), $filter('translate')('ocsp_web_dashboard_memory_available')];
    });
    $http.get('/api/chart/summary').success((data)=>{
      $scope.task_names = data.names;
      $scope.task_ids = data.tasks;
      $scope.task_records = data.records;
    });
  }]);
