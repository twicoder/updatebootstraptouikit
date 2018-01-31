'use strict';

/**
 * For label management main page controller
 */
angular.module('ocspApp')
  .controller('AlarmManagementCtrl', ['$scope', '$http', '$rootScope', '$filter', '$uibModal', 'NgTableParams', 'moment', 'Notification',
    function ($scope, $http, $rootScope, $filter, $uibModal, NgTableParams, moment, Notification) {
      $rootScope.init('alarm');

      $scope.lang = $rootScope.lang;

      function init() {
        $http.get("/api/alarm/history/all").success((data) => {
          data.forEach((item) => {
            item.alarm_time = moment(item.alarm_time).format("YYYY-MM-DD HH:mm:ss");
            item.alarm_name = $scope.lang === 'zh' ? item.alarm_ChName : item.alarm_EnName;
            item.alarm_levelName = $scope.lang === 'zh' ? item.alarm_level.zh : item.alarm_level.en;
          });
          $scope.allAlarms = new NgTableParams({ 'count': '20' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: data });
        });

        $http.get("/api/alarm/definition/all").success((data) => {
          data.forEach((item) => {
            item.alarm_name = $scope.lang === 'zh' ? item.alarm_ChName : item.alarm_EnName;
            item.alarm_levelName = $scope.lang === 'zh' ? item.alarm_level.zh : item.alarm_level.en;
          });
          $scope.allAlarmDefinitions = new NgTableParams({ 'count': '20' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: data });
        });
      }

      init();

      $scope.showConfigPage = function (oneAlarmDefinition) {
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'showDefinitionConfig.html',
          size: 'lg',
          backdrop: 'static',
          scope: $scope,
          controller: ['$scope', function ($scope) {

            $scope.propertiesToConfig = [];
            let rawAlarmProperties = JSON.parse(oneAlarmDefinition.alarm_properties);
            if (rawAlarmProperties) {
              rawAlarmProperties.forEach((item) => {
                $scope.propertiesToConfig.push({
                  "name": $scope.lang === 'zh' ? item.ChName : item.EnName,
                  "key": item.key,
                  "value": ""
                });
              });
              $scope.allAlarmPropertiesCanBeConfigured = new NgTableParams({ 'count': '7' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.propertiesToConfig });
            } else {
              $scope.errorMsg = "没有可以配置的属性！";
            }

            $scope.targetUrlToFetchData = "/api/tasksjobs/withdatainterfaceproperties/all/";
            $scope.targetUrlToPostData = "/api/tasksjobs/withdatainterfaceproperties/all/";
            if (oneAlarmDefinition.alarm_component_name === 'EVENT') {
              $scope.targetUrlToFetchData = "/api/event/withdatainterfaceproperties/all/";
              $scope.targetUrlToPostData = "/api/event/withdatainterfaceproperties/all/";
            }
            $http.get($scope.targetUrlToFetchData).success(function (data) {
              data.forEach((item) => {
                item.parsedProperties = JSON.parse(item.properties);
                item.oldAlarmConfigs = [];
                if (item.parsedProperties.props) {
                  item.parsedProperties.props.forEach((itemProps) => {
                    $scope.propertiesToConfig.forEach((onePropertyCanBeConfig) => {
                      if (itemProps.pname === onePropertyCanBeConfig.key) {
                        item.oldAlarmConfigs.push({
                          "name": itemProps.pname,
                          "value": itemProps.pvalue
                        });
                      }
                    });
                  });
                }
                item.oldAlarmConfigsString = JSON.stringify(item.oldAlarmConfigs);
              });
              $scope.allStreamsData = data;
              $scope.allStreams = new NgTableParams({ 'count': '7' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: data });
            });

            $scope.calcSelectedItems = function (allStreams) {
              let selectedItemCount = 0;
              if (allStreams) {
                allStreams.forEach((item) => {
                  if (item.selected && item.selected === true) {
                    selectedItemCount++;
                  }
                });
              }
              return selectedItemCount;
            };

            $scope.showDetailConfig = function (allStreamsData) {

              let modalDetail = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title-bottom',
                ariaDescribedBy: 'modal-body-bottom',
                templateUrl: 'showDefinitionConfigDetails.html',
                size: 'lg',
                backdrop: 'static',
                scope: $scope,
                controller: ['$scope', function ($scope) {

                  $scope.closeDetailModal = function () {
                    modalDetail.close();
                  };

                  $scope.saveAndCloseDetailModal = function () {
                    allStreamsData.forEach((item) => {
                      if (item.selected) {
                        item.isAlarmConfigured = true;
                        item.newAlarmConfigs = [];
                        $scope.propertiesToConfig.forEach((onePropertyItem) => {
                          item.newAlarmConfigs.push({
                            "name": onePropertyItem.key,
                            "value": onePropertyItem.value
                          });
                        });
                        item.newAlarmConfigsString = JSON.stringify(item.newAlarmConfigs);
                      }
                    });

                    modalDetail.close();
                  };

                }]
              });
            };

            $scope.closeModal = function () {
              modal.close();
            };

            $scope.saveAndCloseModal = function () {
              let dataToPost = [];
              $scope.allStreamsData.forEach((item) => {
                if(item.isAlarmConfigured){
                  dataToPost.push(item);
                }
              });

              $http.post($scope.targetUrlToPostData, { "data": dataToPost })
                .success(function () {
                  Notification.success($filter('translate')('ocsp_web_common_026'));
                  modal.close();
                })
                .error(function (err) {
                  console.error(err);
                  Notification.error($filter('translate')('ocsp_web_common_030'));
                });
            };

          }]
        });
      };

    }]);
