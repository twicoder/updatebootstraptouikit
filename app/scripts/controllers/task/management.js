'use strict';

/**
 * For job management main page controller
 */
angular.module('ocspApp')
  .controller('TaskManagementCtrl', ['$scope', '$http', 'Notification', '$q', '$rootScope', '$ngConfirm', '$uibModal',
    '$interval', '$filter', '$location', 'moment', 'CONFIGS', 'NgTableParams', 'globalDataService',
    function ($scope, $http, Notification, $q, $rootScope, $ngConfirm, $uibModal,
      $interval, $filter, moment, CONFIGS, $location, NgTableParams, globalDataService) {
      $rootScope.init('task');
      //i18n
      $scope.localLang = globalDataService.localLang;
      $scope.auditTypes = globalDataService.auditTypes;
      $scope.auditTimes = globalDataService.auditTimes;

      //Actions and change
      $scope.streamActions = globalDataService.streamActions;
      $scope.isAdminUser = $rootScope.isAdmin();

      $scope.links = [];
      $scope.datasourcecount = 1;
      globalDataService.getLinks().then(data => $scope.links = data);
      globalDataService.getDataSourceCount().then(data => $scope.datasourcecount = parseInt(data.value));
      $scope.stormenabled = $rootScope.stormenabled;

      // Global timer
      let fetchAllTasksJobsStatusInterval = $interval(function () {
        function updateJobsStatusInfo(tasks) {
          if ($scope.jobs !== undefined && $scope.jobs.length > 0) {
            for (let i in $scope.jobs) {
              for (let j in tasks) {
                if ($scope.jobs[i].id === tasks[j].id) {
                  $scope.jobs[i].status = tasks[j].status;
                  $scope.jobs[i].running_time = tasks[j].running_time;
                  break;
                }
              }
            }
          }
        }
        globalDataService.getTasksStatus().then((tasks) => {
          updateJobsStatusInfo(tasks);
        });
        if ($scope.stormenabled === true) {
          globalDataService.getJobsStatus().then((tasks) => {
            updateJobsStatusInfo(tasks);
            if ($scope.selectedJob.status && $scope.selectedJob.status === "STOPPED") {
              $scope.selectedJob.status = 0;
            }
            if ($scope.selectedJob.status && $scope.selectedJob.status === "RUNNING") {
              $scope.selectedJob.status = 2;
            }
          });
        }
      }, 5000);
      globalDataService.registIntervalService(fetchAllTasksJobsStatusInterval);

      //Check spark_home properties
      function _openSparkModal() {
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'stackedModal.html',
          size: 'md',
          scope: $scope,
          backdrop: 'static',
          controller: ['$scope', function ($scope) {
            $scope.closeModal = function () {
              modal.close();
            };
            $scope.inputSpark = function () {
              $http.post("/api/prop/spark", { spark: $scope.spark }).success(function () {
                modal.close();
                $scope._showModal();
              });
            };
          }]
        });
      }

      if ($rootScope.isAdmin()) {
        globalDataService.getSparkProperty().then((data) => { if (!data) { _openSparkModal(); } });
      }

      $scope._showModal = function () {
        $scope.$broadcast('openModal', {});
      };

      let getStormStatusByStatus = function (status) {
        switch (status) {
          case 0:
            return "STOPPED";
          case 1:
            return "START";
          case 2:
            return "RUNNING";
          case 3:
            return "STOP";
          case 4:
            return "RESTARTING";
          case 5:
            return "RETRYING";
        }
      };

      function _changeStatus(item, status) {
        if (!item) {
          //TODO: Globalization
          Notification.error("Cannot update null task");
        } else {
          if (item.enginetype === 'SPARK') {
            $http.post("/api/task/change/" + item.id, { status: status }).success(function () {
              item.status = status;
              // _dealWith(item,status);
              Notification.success($filter('translate')('ocsp_web_common_026'));
            });
          } else if (item.enginetype === 'STORM') {
            let stormStatus = getStormStatusByStatus(status);
            $http.post("/api/job/change/" + item.id, { status: stormStatus }).success(function () {
              item.status = status;
              // _dealWith(item,status);
              Notification.success($filter('translate')('ocsp_web_common_026'));
            });
          } else {
            console.log('ERROR:item doesnt have enginetype property');
          }
        }
      }

      $scope.updateStreamStatus = function (item, actionName) {
        $ngConfirm({
          title: $filter('translate')('ocsp_web_common_038'),
          content: $filter('translate')('ocsp_web_common_039'),
          scope: $scope,
          buttons: {
            ok: {
              text: $filter('translate')("ocsp_web_common_021"),
              action: function () {
                $scope.updateStreamStatusWithoutConfirm(item, actionName);
              }
            },
            cancel: {
              text: $filter('translate')("ocsp_web_common_020"),
            }
          }
        });
      };

      $scope.updateStreamStatusWithoutConfirm = function (item, actionName) {
        let status = 0;
        if (actionName === 'remove') { // delete stream
          status = "delete";
          _changeStatus(item, status);
        } else {
          if (actionName === 'start') {
            status = 1;
          } else if (actionName === 'stop') {
            status = 3;
          } else if (actionName === 'restart') {
            status = 4;
          }
          if (status === 1) {
            $q.all({ prop: $http.get('/api/prop'), userInfo: $http.get('/api/user/' + $rootScope.username) }).then(function (arr) {
              var props = arr.prop.data;
              var userInfo = arr.userInfo.data;
              var kerberosConfigureEnabled = false;
              for (var index in props) {
                if (props[index].name === 'ocsp.kerberos.enable') {
                  kerberosConfigureEnabled = props[index].value;
                }
              }
              if (kerberosConfigureEnabled) {
                if (!globalDataService.isKerberosConfigureCorrect(userInfo)) {
                  let modal = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title-bottom',
                    ariaDescribedBy: 'modal-body-bottom',
                    templateUrl: 'kerberosConfigureMissingWarning.html',
                    size: 'lg',
                    backdrop: 'static',
                    scope: $scope,
                    controller: ['$scope', function ($scope) {
                      $scope.searchItem = {};
                      $scope.closeModal = function () {
                        modal.close();
                      };
                    }]
                  });
                } else {
                  // Kerberos is configured correct, but need check whether keytab file exists
                  let filesNeedCheck = {
                    files: {
                      kafkaconfigfile: userInfo.kafka_keytab,
                      sparkconfigfile: userInfo.spark_keytab,
                      ocsp_kafka_jaas: userInfo.kafka_jaas
                    }
                  };
                  $http.post('/api/user/checkfiles', { "filesNeedCheck": filesNeedCheck }).success(function (data) {
                    if (data.kafkaconfigfileexist && data.sparkconfigfileexist && data.ocsp_kafka_jaasexist) {
                      _changeStatus(item, status);
                    } else {
                      if (!data.kafkaconfigfileexist) {
                        Notification.error("Kafka keytab " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                      if (!data.sparkconfigfileexist) {
                        Notification.error("Spark keytab " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                      if (!data.ocsp_kafka_jaasexist) {
                        Notification.error("Kafka Jaas Config " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                    }
                  });

                }

              } else {
                _changeStatus(item, status);
              }
            });
          } else {
            _changeStatus(item, status);
          }
        }
      };

      $scope.changeStatus = function (item) {
        let name = item.name;
        if (!item.enable) {
          return;
        }
        let status = 0;
        if (name === $filter('translate')('ocsp_web_streams_manage_027')) {
          $ngConfirm({
            title: $filter('translate')('ocsp_web_common_038'),
            content: $filter('translate')('ocsp_web_common_039'),
            scope: $scope,
            buttons: {
              ok: {
                text: $filter('translate')("ocsp_web_common_021"),
                action: function () {
                  status = "delete";
                  _changeStatus(status);
                }
              },
              cancel: {
                text: $filter('translate')("ocsp_web_common_020"),
              }
            }
          });
        } else {
          if (name === $filter('translate')('ocsp_web_streams_manage_024')) {
            status = 1;
          } else if (name === $filter('translate')('ocsp_web_streams_manage_025')) {
            status = 3;
          } else if (name === $filter('translate')('ocsp_web_streams_manage_026')) {
            status = 4;
          }
          if (status === 1) {
            $q.all({ prop: $http.get('/api/prop'), userInfo: $http.get('/api/user/' + $rootScope.username) }).then(function (arr) {
              var props = arr.prop.data;
              var userInfo = arr.userInfo.data;
              var kerberosConfigureEnabled = false;
              for (var index in props) {
                if (props[index].name === 'ocsp.kerberos.enable') {
                  kerberosConfigureEnabled = Boolean(props[index].value === 'true');
                }
              }
              if (kerberosConfigureEnabled) {
                if (!globalDataService.isKerberosConfigureCorrect(userInfo)) {
                  let modal = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title-bottom',
                    ariaDescribedBy: 'modal-body-bottom',
                    templateUrl: 'kerberosConfigureMissingWarning.html',
                    size: 'lg',
                    backdrop: 'static',
                    scope: $scope,
                    controller: ['$scope', function ($scope) {
                      $scope.searchItem = {};
                      $scope.closeModal = function () {
                        modal.close();
                      };
                    }]
                  });
                } else {
                  // Kerberos is configured correct, but need check whether keytab file exists
                  let filesNeedCheck = {
                    files: {
                      kafkaconfigfile: userInfo.kafka_keytab,
                      sparkconfigfile: userInfo.spark_keytab,
                      ocsp_kafka_jaas: userInfo.kafka_jaas
                    }
                  };
                  $http.post('/api/user/checkfiles', { "filesNeedCheck": filesNeedCheck }).success(function (data) {
                    if (data.kafkaconfigfileexist && data.sparkconfigfileexist && data.ocsp_kafka_jaasexist) {
                      _changeStatus(status);
                    } else {
                      if (!data.kafkaconfigfileexist) {
                        Notification.error("Kafka keytab " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                      if (!data.sparkconfigfileexist) {
                        Notification.error("Spark keytab " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                      if (!data.ocsp_kafka_jaasexist) {
                        Notification.error("Kafka Jaas Config " + $filter('translate')('ocsp_web_user_manage_010'));
                      }
                    }
                  });

                }

              } else {
                _changeStatus(status);
              }
            });
          } else {
            _changeStatus(status);
          }
        }
      };

      $scope.selectedJob = {
        input: {
          inputs: [],
          userFields: []
        },
        events: []
      };

      function _init() {
        // Use for create new task
        $scope.task = {
          enginetype: 'SPARK',
          input: {
            inputs: []
          },
          events: []
        };
        $q.all({ tasksjobs: $http.get('/api/tasksjobs'), datasource: $http.get('/api/datasource'), labels: $http.get('/api/label') }).then(function (arr) {
          $scope.jobs = arr.tasksjobs.data;
          $scope.allJobsListParams = new NgTableParams({ 'count': '10' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jobs });

          $scope.datasources = [];
          arr.datasource.data.forEach((item) => {
            if (item.type === "kafka") {
              $scope.datasources.push(item);
            }
          });
          $scope.inputDatasources = [];
          for (let i in $scope.datasources) {
            if ($scope.datasources[i].type === 'kafka') {
              $scope.inputDatasources.push($scope.datasources[i]);
            }
          }
          $scope.inputLabels = arr.labels.data;
        });
      }

      _init();


      $scope.sortLabels = function (arr, index) {
        let temp = $scope.inputLabels;
        arr.splice(index, 1);
        $scope.inputLabels = arr;
        for (let i in temp) {
          let flag = true;
          for (let j in arr) {
            if (temp[i].id === arr[j].id) {
              flag = false;
              break;
            }
          }
          if (flag) {
            $scope.inputLabels.push(temp[i]);
          }
        }
      };

      $scope.addNewEvent = function (array) {
        console.log('addNewEvent called');
        if (array !== undefined) {
          array.push({
            status: 1,
            output: {},
            userFields: [],
            interval: 0,
            audit: {
              enableDate: "none",
              type: "always",
            },
            auditTypes: [
              { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
              { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
              { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
              { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
              { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
            ]
          });
        }
        console.log(array);
      };

      $scope.split = function (str) {
        let result = [];
        if (str !== undefined && str.length > 0) {
          let tmp = str.split(",");
          for (let i in tmp) {
            result.push(tmp[i].trim());
          }
        }
        return result;
      };

      $scope.generate = function (inputs, array) {
        let str = "";
        if (array !== undefined && array.length > 0) {
          let result = new Set();
          if (array[0].fields !== undefined && array[0].fields.trim() !== "") {
            result = new Set($scope.split(array[0].fields));
          }
          for (let i = 1; i < array.length; i++) {
            let tmp = new Set();
            if (array[i].fields !== undefined && array[i].fields.trim() !== "") {
              let splits = $scope.split(array[i].fields);
              for (let j in splits) {
                if (result.has(splits[j])) {
                  tmp.add(splits[j]);
                }
              }
            }
            result = tmp;
          }
          let resultArray = [...result];
          if (resultArray.length > 0) {
            str = resultArray[0];
            for (let i = 1; i < resultArray.length; i++) {
              str += "," + resultArray[i];
            }
          }
        }
        inputs.fields = str;
      };

      $scope.submitMethod = function () {
        let defer = $q.defer();
        $ngConfirm({
          title: $filter('translate')('ocsp_web_common_038'),
          content: $filter('translate')('ocsp_web_common_039'),
          scope: $scope,
          buttons: {
            ok: {
              text: $filter('translate')("ocsp_web_common_021"),
              action: function () {
                let postAddress = "/api/task";
                if ($scope.task.enginetype === 'STORM') {
                  postAddress = "/api/job";
                }
                $http.post(postAddress, { task: $scope.task }).success(function () {
                  $scope.task = {
                    enginetype: 'SPARK',
                    name: '',
                    input: {},
                    events: []
                  };
                  Notification.success($filter('translate')('ocsp_web_common_026'));
                  _init();
                  defer.resolve();
                });
              }
            },
            cancel: {
              text: $filter('translate')("ocsp_web_common_020"),
              action: function () {
                defer.reject();
              }
            }
          }
        });
        return defer.promise;
      };

      //Page helpers

      $scope.remove = function (array, $index) {
        array.splice($index, 1);
      };

      $scope.addInputSource = function (inputsources) {
        if (!!inputsources) {
          if (inputsources.length < $scope.datasourcecount) {
            $scope.add(inputsources);
          } else {
            Notification.error($filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part1') + ' ' + $scope.datasourcecount + ' ' + $filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part2'));
          }
        }
      };

      $scope.add = function (array) {
        if (array !== undefined) {
          array.push({
            status: 1,
            output: {},
            userFields: []
          });
        }
      };

      $scope.addUserField = function (input) {
        if (input.userFields === undefined || input.userFields === null) {
          input.userFields = [];
        }
        input.userFields.push({
          pname: "",
          pvalue: ""
        });
      };

      $scope.getAllPossibleFields = function (fields, userFields) {
        let resultStr = fields;
        if (userFields !== undefined && userFields !== null) {
          userFields.forEach((x) => { resultStr += "," + x.pname; });
        }
        return resultStr;
      };

      $scope.trimStr = function (str) {
        return str.replace(/(^\s*)|(\s*$)/g, '');
      };

      $scope.echoClick = function(){
        console.log("echo the click!");
      };

      $scope.createOneStream = function () {
        $scope.searchItem = {};
        $scope.closeModal = function () {
          $scope.task = {
            enginetype: 'SPARK',
            input: {
              inputs: []
            },
            events: []
          };
          modal.close();
        };

        $scope.tryToSumit = function () {
          let submitPromise = $scope.submitMethod();
          if (submitPromise) {
            submitPromise.then(function () {
              $scope.closeModal();
            }, function () {
            });
          }
        };
      };

    }]);
