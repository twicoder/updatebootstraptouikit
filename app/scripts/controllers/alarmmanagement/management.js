'use strict';

/**
 * For label management main page controller
 */
angular.module('ocspApp')
  .controller('AlarmManagementCtrl', ['$scope', '$http', '$rootScope', '$filter', 'NgTableParams', 'moment', 'Notification',
    function ($scope, $http, $rootScope, $filter, NgTableParams, moment, Notification) {
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

      
      $scope.saveAndCloseDetailModal = function () {
        $scope.allStreamsData.forEach((item) => {
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

      };



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

      $scope.targetUrlToFetchData = "/api/tasksjobs/withdatainterfaceproperties/all/";
      $scope.targetUrlToPostData = "/api/tasksjobs/withdatainterfaceproperties/all/";

      $scope.getConfigPageData = function (oneAlarmDefinition) {
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


        if (oneAlarmDefinition.alarm_component_name === 'EVENT') {
          $scope.targetUrlToFetchData = "/api/event/withdatainterfaceproperties/all/";
          $scope.targetUrlToPostData = "/api/event/withdatainterfaceproperties/all/";
        } else {
          $scope.targetUrlToFetchData = "/api/tasksjobs/withdatainterfaceproperties/all/";
          $scope.targetUrlToPostData = "/api/tasksjobs/withdatainterfaceproperties/all/";
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
      };


      $scope.saveAndCloseModal = function () {
        let dataToPost = [];
        $scope.allStreamsData.forEach((item) => {
          if (item.isAlarmConfigured) {
            dataToPost.push(item);
          }
        });

        $http.post($scope.targetUrlToPostData, { "data": dataToPost })
          .success(function () {
            Notification.success($filter('translate')('ocsp_web_common_026'));
            var modal = UIkit.modal("#alarmConfigPopupPageId");
            modal.hide();
          })
          .error(function (err) {
            console.error(err);
            Notification.error($filter('translate')('ocsp_web_common_030'));
          });
      };


    }]);
