'use strict';

/**
 * @ngdoc overview
 * @name ocspApp
 * @description
 * # ocspApp
 *
 * Main module of the application.
 */
angular
  .module('ocspApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'pascalprecht.translate',
    'ngFileUpload',
    "isteven-multi-select",
    "dndLists",
    "ui.bootstrap",
    'ui-notification',
    'angularSpinner',
    'ngCookies',
    'ui.select',
    'toggle-switch',
    'cfp.hotkeys',
    'angularMoment',
    'chart.js',
    'textAngular',
    'cp.ngConfirm',
    'ngTable',
    'ocspcomponents'
  ])
  .config(function ($routeProvider) {
    const updateGlobalInfoTimerStatusFunc = function ($http,$rootScope,$location,$interval,moment) {
      $rootScope.lang = window.navigator.userLanguage || window.navigator.language;
      if ($rootScope.lang ) {
        $rootScope.lang = $rootScope.lang.substr(0, 2);
      } else {
        $rootScope.lang = 'zh';
      }

      $rootScope.updateAlarmInfo = function(){
        $http.get("/api/prop/isalarmenabled").success((alarmEnableStatus) => {
          if(alarmEnableStatus.enabled === "true"){
            $http.get("/api/alarm/").success((data) => {
              $rootScope.alarms = data;
              $rootScope.alarms.forEach((item)=>{
                item.alarm_time = moment(item.alarm_time).format("YYYY-MM-DD HH:mm:ss");
                item.alarm_name = $rootScope.lang === 'zh' ? item.alarm_ChName : item.alarm_EnName;
                item.alarm_levelName = $rootScope.lang === 'zh' ? item.alarm_level.zh : item.alarm_level.en;
              });
            });
          }
        });
      };
      if(!$rootScope.updateGlobalInfoTimer){
        $rootScope.updateGlobalInfoTimer = $interval($rootScope.updateAlarmInfo,10*1000);
      }

    };

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/task_management', {
        templateUrl: 'views/task/management.html',
        controller: 'TaskManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/task_management/:id', {
        templateUrl: 'views/task/management_details.html',
        controller: 'TaskManagementDetailsCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/label_management', {
        templateUrl: 'views/label/management.html',
        controller: 'LabelManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/system_management', {
        templateUrl: 'views/system/management.html',
        controller: 'SystemManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/user_management', {
        templateUrl: 'views/user/management.html',
        controller: 'UserManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/kerberos_config', {
        templateUrl: 'views/user/kerberos.html',
        controller: 'UserManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/dashboard', {
        templateUrl: 'views/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/logmanagement', {
        templateUrl: 'views/logmanagement/loglist.html',
        controller: 'LogManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/logmanagement/:logFileName', {
        templateUrl: 'views/logmanagement/logdetail.html',
        controller: 'LogManagementDetailCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/alarmmanagement', {
        templateUrl: 'views/alarmmanagement/management.html',
        controller: 'AlarmManagementCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/alarmmanagement/:alarmtaskid', {
        templateUrl: 'views/alarmmanagement/managementdetails.html',
        controller: 'AlarmManagementDetailsCtrl',
        resolve: {
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .when('/events_center', {
        templateUrl: 'views/events/center.html',
        controller: 'EventsCenterCtrl',
        resolve: {
          cepConfig: function ($http,$rootScope,$location) {
            $http.get("/api/config/cepEnable").success((data) => {
              $rootScope.cep = JSON.parse(data);
              if(!$rootScope.cep){
                $location.path('/');
              }
            });
          },
          updateGlobalInfoTimerStatus: updateGlobalInfoTimerStatusFunc
        }
      })
      .otherwise({
        controller: function () {
          window.location.replace('/404');
        },
        template: "<div></div>"
      });
  })
  .config(['NotificationProvider', 'usSpinnerConfigProvider', '$httpProvider', 'ChartJsProvider',
    function (NotificationProvider, usSpinnerConfigProvider, $httpProvider, ChartJsProvider) {
    NotificationProvider.setOptions({
      delay: 10000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'right',
      positionY: 'bottom'
    });
    usSpinnerConfigProvider.setDefaults({ color: 'orange', radius: 20 });
    $httpProvider.interceptors.push('AuthInterceptor', 'UsInterceptor');
    ChartJsProvider.setOptions({
      chartColors: ['#4da9ff', '#79d2a6', '#ff9900', '#ff704d', '#669999', '#4d0000']
    });
  }])
  .config(['$translateProvider', '$windowProvider', function ($translateProvider, $windowProvider) {
    let window = $windowProvider.$get();
    let lang = window.navigator.userLanguage || window.navigator.language;
    if (lang) {
      lang = lang.substr(0, 2);
      $translateProvider.preferredLanguage(lang);
    }
  }])
  .constant('CONFIGS', {
    taskInterval: 5000,
    chartRefreshInterval: 20000,
    expires: 3,//Hours
  })
  .run(['$rootScope', '$filter', '$cookies', '$location', '$http','$interval', 'CONFIGS', '$uibModal', 
    'moment', 'NgTableParams','globalDataService',
    ($rootScope, $filter, $cookies, $location, $http, $interval, CONFIGS, $uibModal, 
      moment, NgTableParams,globalDataService) => {

      $rootScope.globalDataService = globalDataService;

      $rootScope.lang = window.navigator.userLanguage || window.navigator.language;
      if ($rootScope.lang ) {
        $rootScope.lang = $rootScope.lang.substr(0, 2);
      } else {
        $rootScope.lang = 'zh';
      }

      $rootScope.checkAlarms = function(){
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'showalarmsummary.html',
          size: 'lg',
          backdrop: 'static',
          scope: $rootScope,
          controller: ['$rootScope', function ($rootScope) {
            $rootScope.allAlarmsToNotify = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $rootScope.alarms });
                        
            $rootScope.closeModal = function () {
              modal.close();
            };

          }]
        });
      };

      $rootScope.updateGlobalInfoTimer=null;

      $rootScope.title = $filter('translate')('ocsp_web_common_000');
      $rootScope.username = null;
      $rootScope.tab = null;
      $rootScope.message = null;
      $rootScope.styles = null;
      globalDataService.getCepEnableStatus().then(data => $rootScope.cep = JSON.parse(data));
      globalDataService.getStormEnableStatus().then(data => $rootScope.stormenabled = data.stormenabled);
      globalDataService.getProps().then((props) =>{
        for(var index in props){
          if(props[index].name === 'ocsp.kerberos.enable'){
            $rootScope.shouldShowKerberosConfigure = props[index].value;
          }
        }
      });
      
      $rootScope.changeTab = (tab) => {
        $rootScope.tab = tab;
      };
      $rootScope.logout = () => {
        $cookies.remove("username");
        $rootScope.username = null;
        $rootScope.message = null;
        $rootScope.styles = null;
        $location.path("/");
        $interval.cancel($rootScope.updateGlobalInfoTimer);
        globalDataService.clearIntervalServices();
      };
      let _getCookie = (name) => {
        let value = $cookies.get(name);
        $cookies.put(name, value, {'expires': moment().add(CONFIGS.expires, 'h').toDate()});
        return value;
      };
      $rootScope.isAdmin = () => {
        let name = $cookies.get("username");
        return name === "ocspadmin";
      };

      $rootScope.login = (username, password) => {
        $http.post("/api/user/login/", { username, password }).success(function (user) {
          if (user.status) {
            $cookies.put("username", username);
            $cookies.put("token", user.token);
            if ($rootScope.isAdmin()) {
              $location.path("/dashboard");
            } else {
              $location.path("/task_management");
            }
            $rootScope.styles = null;
            $rootScope.message = null;
            $rootScope.changeTab('task');

            $rootScope.updateAlarmInfo = function(){
              $http.get("/api/prop/isalarmenabled").success((alarmEnableStatus) => {
                if(alarmEnableStatus.enabled === "true"){
                  $http.get("/api/alarm/").success((data) => {
                    $rootScope.alarms = data;
                    $rootScope.alarms.forEach((item)=>{
                      item.alarm_time = moment(item.alarm_time).format("YYYY-MM-DD HH:mm:ss");
                      item.alarm_name = $rootScope.lang === 'zh' ? item.alarm_ChName : item.alarm_EnName;
                      item.alarm_levelName = $rootScope.lang === 'zh' ? item.alarm_level.zh : item.alarm_level.en;
                    });
                  });
                }
              });
            };
            if(!$rootScope.updateGlobalInfoTimer){
              $rootScope.updateGlobalInfoTimer = $interval($rootScope.updateAlarmInfo,10*1000);
            }
            
          } else {
            $rootScope.message = $filter('translate')('ocsp_web_user_manage_005');
            $rootScope.styles = "redBlock";
            $cookies.remove("username");
          }
        }).error(function (err) {
          $rootScope.message = err;
        });
      };
      $rootScope.getUsername = () => {
        return _getCookie("username");
      };
      $rootScope.getToken = () => {
        return _getCookie("token");
      };
      $rootScope.init = (tab, adminGuard = false) => {
        let name = _getCookie("username");
        if (name === null || name === undefined) {
          $rootScope.username = null;
          $cookies.remove("username");
          $rootScope.message = $filter('translate')('ocsp_web_user_manage_007');
          $rootScope.styles = "redBlock";
          $location.path("/");
        } else {
          if (adminGuard && !$rootScope.isAdmin()) {
            $rootScope.username = null;
            $cookies.remove("username");
            $rootScope.message = $filter('translate')('ocsp_web_user_manage_008');
            $rootScope.styles = "redBlock";
            $location.path("/");
          } else {
            $rootScope.changeTab(tab);
            $rootScope.username = name;
          }
        }

        //每次进入一个新页面，需要清理掉之前页面中留下了的定时刷新数据的服务，以免造成数据处理的负担
        globalDataService.clearIntervalServices();
      };
    }]);
