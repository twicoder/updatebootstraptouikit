'use strict';

/**
 * For label management main page controller
 */
angular.module('ocspApp')
  .controller('AlarmManagementDetailsCtrl', ['$scope', '$http', '$routeParams', '$rootScope', '$filter', '$uibModal', 'NgTableParams','moment',
    function ($scope, $http, $routeParams, $rootScope, $filter, $uibModal, NgTableParams,moment) {
      $rootScope.init('alarm');

      $scope.lang = $rootScope.lang;
      $scope.alarmsOfCurrentTask = [];
      $scope.alarmtaskid = $routeParams.alarmtaskid;

      function init() {
        $http.get('/api/alarm/' + $scope.alarmtaskid).success(function (data) {
          $scope.alarmsOfCurrentTask = data;
          $scope.alarmsOfCurrentTask.forEach((item)=>{
            item.alarm_time = moment(item.alarm_time).format("YYYY-MM-DD HH:mm:ss");
            item.alarm_name = $scope.lang === 'zh' ? item.alarm_ChName : item.alarm_EnName;
            item.alarm_levelName = $scope.lang === 'zh' ? item.alarm_level.zh : item.alarm_level.en;
          });
          $rootScope.allAlarms = new NgTableParams({ 'count': '20' }, {
            counts: [],
            paginationMinBlocks: 4,
            paginationMaxBlocks: 7,
            dataset: $scope.alarmsOfCurrentTask
          });
        });
      }

      init();

      $scope.showDetail = function (oneAlarmData) {
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'showAlarmDetail.html',
          size: 'lg',
          backdrop: 'static',
          scope: $scope,
          controller: ['$scope', function ($scope) {
            let dataToShow = [];

            const alarmContent = JSON.parse(oneAlarmData.alarm_content);
            for(let key in alarmContent){
              dataToShow.push({
                "key":key,
                "value":alarmContent[key]
              });
            }

            $scope.alarmContentList = new NgTableParams({ 'count': '5' }, {
              counts: [],
              paginationMinBlocks: 4,
              paginationMaxBlocks: 7,
              dataset: dataToShow
            });

            $scope.closeModal = function () {
              modal.close();
            };
          }]
        });
      };

    }]);
