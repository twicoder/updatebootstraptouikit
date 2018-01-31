'use strict';

angular.module('ocspApp')
  .filter('filterEvents', function () {
    return function (events, searchOption) {
      let results = Array();
      if (!!events) {
        events.forEach(function (value) {
          results.push(value);
        });
      }

      let tmpResults = Array();
      if (!!searchOption.name && searchOption.name !== "") {
        results.forEach(function (value) {
          if (value.name.indexOf(searchOption.name) >= 0) {
            tmpResults.push(value);
          }
        });
        results = tmpResults;
      }

      tmpResults = Array();
      if (!!searchOption.badge_number) {
        results.forEach(function (value) {
          if (value.STREAM_EVENT_CEP.badge_number === searchOption.badge_number) {
            tmpResults.push(value);
          }
        });
        results = tmpResults;
      }

      tmpResults = Array();
      if (!!searchOption.status) {
        results.forEach(function (value) {
          if (value.status === parseInt(searchOption.status)) {
            tmpResults.push(value);
          }
        });
        results = tmpResults;
      }

      tmpResults = Array();
      if (!!searchOption.start && !!searchOption.end) {
        let startDate = new Date(searchOption.start);
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date(searchOption.end);
        endDate.setHours(23, 59, 59, 59);
        results.forEach(function (value) {
          if (!!value.startDate && value.startDate !== "" && !!value.endDate && value.endDate !== "") {
            let targetStartDate = new Date(value.startDate);
            let targetEndDate = new Date(value.endDate);
            if (targetStartDate >= startDate && targetEndDate <= endDate) {
              tmpResults.push(value);
            }
          }
        });
        results = tmpResults;
      }

      return results;
    };
  })
  .controller('EventsCenterCtrl', ['$scope', '$rootScope', '$http', 'Notification', '$filter', '$q', '$uibModal', 'moment', '$sce', 'NgTableParams', '$translate', ($scope, $rootScope, $http, Notification, $filter, $q, $uibModal, moment, $sce, NgTableParams, $translate) => {
    $rootScope.init('cep');
    $scope.treedata = [];
    $scope.isMainFormDataChanged = false;
    $scope.searchOption = {};

    $scope.searchStatusOptions = [
      {
        value: -1,
        name: $translate.instant('ocsp_web_streams_cep_status_empty')
      },
      {
        value: 0,
        name: $translate.instant('ocsp_web_streams_manage_025')
      },
      {
        value: 1,
        name: $translate.instant('ocsp_web_streams_manage_024')
      }
    ];

    $scope.updateSearchOption = function (eventsSearchOption) {
      $scope.searchOption.name = eventsSearchOption.name;
      $scope.searchOption.badge_number = eventsSearchOption.badge_number;
      $scope.searchOption.status = eventsSearchOption.selected;
      if (!!eventsSearchOption.period && !!eventsSearchOption.period.start) {
        $scope.searchOption.start = eventsSearchOption.period.start;
      }
      if (!!eventsSearchOption.period && !!eventsSearchOption.period.end) {
        $scope.searchOption.end = eventsSearchOption.period.end;
      }
    };

    function _status(status) {
      switch (status) {
        case 0: return $sce.trustAsHtml(`<span class="label label-danger">` + $translate.instant('ocsp_web_streams_manage_025') + `</span>`);
        case 1: return $sce.trustAsHtml(`<span class="label label-success">` + $translate.instant('ocsp_web_streams_manage_024') + `</span>`);
      }
    }

    function _findNodeTree(tree, event) {
      if (!event.STREAM_EVENT_CEP) {
        return;
      }
      if (tree && tree.length > 0) {
        for (let i in tree) {
          if (tree[i].id === event.STREAM_EVENT_CEP.type) {
            if (!tree[i].children) {
              tree[i].children = [];
            }
            tree[i].children.push({
              id: event.id,
              type: "event",
              label: _status(event.status) + " " + event.name,
              status: event.status,
              event: event
            });
            return;
          } else if (tree[i].children && tree[i].children.length > 0) {
            _findNodeTree(tree[i].children, event);
          }
        }
      }
    }

    function _noLeaf(tree) {
      if (tree && tree.length > 0) {
        for (let i in tree) {
          if ((!tree[i].children || tree[i].children.length === 0) && tree[i].type && tree[i].type === "type") {
            tree[i].noLeaf = true;
          } else {
            _noLeaf(tree[i].children);
          }
        }
      }
    }

    function _findTypesName(type) {
      if (type.children_types) {
        let types = JSON.parse(type.children_types);
        for (let i in types) {
          for (let j in $scope.types) {
            if (types[i] === $scope.types[j].id) {
              $scope.types[j].vname = type.vname + "/" + $scope.types[j].type_name;
              _findTypesName($scope.types[j]);
              break;
            }
          }
        }
      }
    }

    let collapseTree = function (tree) {
      for (let i in tree) {
        tree[i].expanded = false;
        if (!!tree[i].children && tree[i].children.length !== 0) {
          collapseTree(tree[i].children);
        }
      }
    };

    function _init() {
      $scope.history = null;
      $scope.item = null;
      $scope.oldItem = null;
      $scope.branch = null;
      $scope.hook = 0;
      $scope.eventsList = [];
      $scope.eventsSearch = {};
      $q.all({
        structure: $http.get('/api/typestructure'),
        types: $http.get('/api/typestructure/all'),
        events: $http.get('/api/event/all'),
        datasource: $http.get('/api/datasource'),
        outputinterface: $http.get('/api/datainterface/output'),
        streams: $http.get('/api/task'),
        labels: $http.get('/api/label')
      }).then((arr) => {
        let tree = arr.structure.data;
        let events = arr.events.data;
        $scope.tasks = arr.streams.data;
        $scope.types = arr.types.data;
        $scope.datasources = arr.datasource.data;
        $scope.output = arr.outputinterface.data;
        $scope.inputLabels = arr.labels.data;
        for (let i in events) {
          _findNodeTree(tree, events[i]);
          if (!events[i].STREAM_EVENT_CEP || !events[i].STREAM_EVENT_CEP.type) {
            tree.push({
              id: events[i].id,
              type: "event",
              label: _status(events[i].status) + " " + events[i].name,
              status: events[i].status,
              event: events[i]
            });
          }
        }
        for (let i in $scope.types) {
          if (!$scope.types[i].parent_type) {
            $scope.types[i].vname = "/" + $scope.types[i].type_name;
            _findTypesName($scope.types[i]);
          }
        }
        _noLeaf(tree);
        collapseTree(tree);
        $scope.treedata = tree;
      });
    }

    _init();

    $scope.onSelect = function (item) {
      //Clear periods when select audit type
      item.audit.periods = [{}];
    };

    function _parseFields(diid, event) {
      $q.all({
        datainterface: $http.get('/api/datainterface/' + diid),
        labels: $http.get('/api/label/diid/' + diid)
      }).then(function (arr) {
        if (arr.datainterface && arr.datainterface.data) {
          let inputDi = {};
          if (!!arr.datainterface.data) {
            inputDi = JSON.parse(arr.datainterface.data[0].properties);
          }
          let result = "";
          if (inputDi.fields) {
            if (inputDi.fields.length > 0) {
              result = inputDi.fields[0].pname;
            }
            for (let i = 1; i < inputDi.fields.length; i++) {
              result += "," + inputDi.fields[i].pname;
            }
          }
          event.inputFields = result;
        }
        let labels = [];
        for (let i in arr.labels.data) {
          for (let j in $scope.inputLabels) {
            if (arr.labels.data[i].label_id === $scope.inputLabels[j].id) {
              labels.push($scope.inputLabels[j]);
            }
          }
        }
        event.labels = labels;
      });
    }

    $scope.switchAuditPeriod = function (item) {
      if (!!item.audit.enableDateForSwitchButton) {
        $scope.item.audit.enableDate = "have";
        $scope.auditTypes = [
          { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
          { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
          { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
          { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
        ];
      } else {
        $scope.item.audit.enableDate = "none";
        $scope.auditTypes = [
          { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
          { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
          { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
          { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
          { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
        ];
      }
      $scope.updateFormDirtyStatus();
    };

    function _parseItem(record) {
      if (record && record.config_data) {
        $scope.item = JSON.parse(record.config_data);
        if (!$scope.item.audit) {
          $scope.item.audit = { type: "always", periods: [] };
          $scope.item.audit.enableDateForSwitchButton = false;
        }
        if ($scope.item.audit.enableDate === 'have') {
          $scope.item.audit.startDate = moment($scope.item.audit.startDate).toDate();
          $scope.item.audit.endDate = moment($scope.item.audit.endDate).toDate();
          $scope.item.audit.enableDateForSwitchButton = true;
        } else {
          $scope.item.audit.enableDateForSwitchButton = false;
          $scope.auditTypes = [
            { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
          ];
        }
        if ($scope.item.audit.periods && $scope.item.audit.periods.length > 0) {
          for (let i in $scope.item.audit.periods) {
            $scope.item.audit.periods[i].start = moment($scope.item.audit.periods[i].start).toDate();
            $scope.item.audit.periods[i].end = moment($scope.item.audit.periods[i].end).toDate();
          }
        }
        if ($scope.item.task) {
          _parseFields($scope.item.task.diid, $scope.item);
        }
        $scope.item.version = (parseInt(history.version) ? parseInt(history.version) : 0) + 1;
        if ($scope.item.parent && !$scope.item.parent.vname) {
          for (let i = 0; i < $scope.types.length; i++) {
            if ($scope.item.parent.id === $scope.types[i].id) {
              $scope.item.parent = $scope.types[i];
              break;
            }
          }
        }
      }
      if (!!!$scope.item.note) {
        $scope.item.note = "";
      }
      $scope.oldItem = JSON.parse(JSON.stringify($scope.item));
    }

    $scope.openCreateType = () => {
      let modal = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title-bottom',
        ariaDescribedBy: 'modal-body-bottom',
        templateUrl: 'type.html',
        size: 'md',
        backdrop: 'static',
        scope: $scope,
        controller: ['$scope', 'Notification', function ($scope, Notification) {
          $scope.newType = {};
          $scope.closeModal = function () {
            modal.close();
          };
          $scope.saveType = function () {
            angular.forEach($scope.typeForm.$error, function (field) {
              angular.forEach(field, function (errorField) {
                errorField.$setTouched();
              });
            });
            if ($("#typeForm .ng-invalid").length === 0) {
              $http.post("/api/typestructure", { newType: $scope.newType }).then(function () {
                _init();
                modal.close();
                Notification.success($filter('translate')('ocsp_web_common_026'));
              });
            }
          };
        }]
      });
    };

    $scope.openSearchModal = () => {
      let modal = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title-bottom',
        ariaDescribedBy: 'modal-body-bottom',
        templateUrl: 'search.html',
        size: 'lg',
        backdrop: 'static',
        scope: $scope,
        controller: ['$scope', function ($scope) {
          $scope.searchItem = {};
          $scope.closeModal = function () {
            modal.close();
          };
          $scope.search = function () {
            $http.post("/api/event/search", { searchItem: $scope.searchItem }).success(function (events) {
              $http.get('/api/typestructure').success(function (tree) {
                for (let i in events) {
                  _findNodeTree(tree, events[i]);
                  if (!events[i].STREAM_EVENT_CEP) {
                    tree.push({
                      id: events[i].id,
                      type: "event",
                      label: _status(events[i].status) + " " + events[i].name,
                      status: events[i].status,
                      event: events[i]
                    });
                  }
                }
                _noLeaf(tree);
                $scope.$parent.treedata = tree;
                $scope.$parent.searchItem = JSON.stringify($scope.searchItem);
                modal.close();
              });
            });
          };
        }]
      });
    };

    $scope.trimStr = function (str) {
      return str.replace(/(^\s*)|(\s*$)/g, '');
    };

    $scope.openCreateEvent = () => {
      let modal = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title-bottom',
        ariaDescribedBy: 'modal-body-bottom',
        templateUrl: 'event.html',
        size: 'lg',
        backdrop: 'static',
        scope: $scope,
        controller: ['$scope', 'Notification', function ($scope, Notification) {
          $scope.newEvent = {
            output: {},
            inputFields: '',
            select_expr: '',
            interval: 0
          };
          $scope.closeModal = function () {
            modal.close();
          };

          $scope.outputFieldsInvalid = false;
          $scope.outputFieldsInvalidMessage = "";
          $scope.userFieldsFromDB = [];

          $scope.checkOutputFileds = function (userFieldsFromDB) {
            let invalidOuptuFields = [];

            if (!!$scope.newEvent.select_expr) {
              let existsFields = $scope.newEvent.inputFields.split(',');
              if (userFieldsFromDB !== undefined && userFieldsFromDB !== null) {
                existsFields.concat(userFieldsFromDB.map((x) => x.pname));
                userFieldsFromDB.forEach((x) => { existsFields.push(x.pname); });
              }

              let labels = $scope.newEvent.labels;
              if (labels !== undefined) {
                for (let i in labels) {
                  if (labels[i].properties !== undefined) {
                    let items = JSON.parse(labels[i].properties);
                    if (items && items.labelItems && items.labelItems.length > 0) {
                      for (let j in items.labelItems) {
                        existsFields.push(items.labelItems[j].pvalue);
                      }
                    }
                  }
                }
              }


              let outputFields = $scope.newEvent.select_expr.split(',');

              for (let idx in outputFields) {
                let tmpExistCheck = false;
                for (let innerIdx in existsFields) {
                  if ($scope.trimStr(outputFields[idx]) === $scope.trimStr(existsFields[innerIdx])) {
                    tmpExistCheck = true;
                    break;
                  }
                }
                if (!tmpExistCheck) {
                  invalidOuptuFields.push(outputFields[idx]);
                }
              }

              if (invalidOuptuFields.length !== 0) {
                $scope.outputFieldsInvalid = true;
                $scope.outputFieldsInvalidMessage = invalidOuptuFields.join(',') + $translate.instant('ocsp_web_common_035');
              } else {
                $scope.outputFieldsInvalid = false;
                $scope.outputFieldsInvalidMessage = "";
              }
            } else {
              $scope.outputFieldsInvalid = false;
              $scope.outputFieldsInvalidMessage = "";
            }

          };

          $scope.eventcodealreadyexists = false;

          $scope.focusEventCode = function () {
            $scope.eventcodealreadyexists = false;
          };
          $scope.unfocusEventCode = function (eventCode) {
            $http.get("/api/event/cep/" + eventCode).success(function (data) {
              if (!!data.code) {
                $scope.eventcodealreadyexists = true;
              }
            });
          };

          $scope.selectEventStream = function ($item) {
            $http.get('/api/datainterface/' + $item.diid).success(function (data) {
              if (data.length !== 0) {
                let propertiesOfDatainterfaceDataFromDB = JSON.parse(data[0].properties);
                $scope.userFieldsFromDB = propertiesOfDatainterfaceDataFromDB.userFields;
              }
            });
            $item.diid = $item.diid || $item.diid_fk; // make sure both spark and storm stream will have diid prop;
            _parseFields($item.diid, $scope.newEvent);
          };
          $scope.saveEvent = function () {
            angular.forEach($scope.eventForm.$error, function (field) {
              angular.forEach(field, function (errorField) {
                errorField.$setTouched();
              });
            });
            if ($("#eventForm .ng-invalid").length === 0) {
              if ($scope.outputFieldsInvalid) {
                Notification.error($scope.outputFieldsInvalidMessage);
                return;
              }

              if ($scope.newEvent.note) {
                $scope.newEvent.note = $scope.newEvent.note.replace(/[<p>|</p>]/g, "");
                $scope.newEvent.note = `<p>${$scope.newEvent.note}</p>`;
              }
              $scope.newEvent.version = "1";
              $http.get("/api/event/cep/" + $scope.newEvent.cep.code).success(function (data) {
                if (!!data.code) {
                  Notification.error($filter('translate')('ocsp_web_streams_cep_eventcodeexists'));
                } else {
                  $http.post("/api/event/", { event: $scope.newEvent }).success(function (data) {
                    $scope.newEvent.id = data.id;
                    $http.post("/api/history/event", {
                      event: {
                        config_data: $scope.newEvent,
                        note: $scope.newEvent.note, version: $scope.newEvent.version
                      }
                    }).success(function () {
                      _init();
                      modal.close();
                      Notification.success($filter('translate')('ocsp_web_common_026'));
                    });
                  });
                }
              });
            }
          };
        }]
      });
    };

    function _getHistory(id) {
      $http.get("/api/history/" + id).success((data) => {
        $scope.history = data;
        $scope.hook = 0;
        if ($scope.history.length > 0) {
          $scope.history[0].active = true;
          $scope.history[0].first = true;
          _parseItem($scope.history[0]);
          if ($scope.history.length > 4) {
            for (let i = 4; i < $scope.history.length; i++) {
              $scope.history[i].hide = true;
            }
          }
        }
      });
    }

    $scope.deleteBranch = (branch) => {
      let childrenNumberOfBranch = JSON.parse(branch.children_types);
      if (childrenNumberOfBranch.length === 0) {
        $http.delete('/api/typestructure/' + branch.id).success(function (data) {
          if (data.success) {
            Notification.success($filter('translate')('ocsp_web_streams_cep_deletetypesuccess'));
            _init();
          } else {
            Notification.error($filter('translate')('ocsp_web_streams_cep_deletetypefailed'));
          }
        });
      } else {
        Notification.error($filter('translate')('ocsp_web_streams_cep_cantdeletetypewithchild'));
      }
    };

    $scope.changeEvent = (branch) => {
      $scope.searchOption = {};
      $scope.history = null;
      $scope.item = null;
      $scope.eventsList = [];
      $scope.eventsSearch = {};
      $scope.userFieldsFromDB = Array();
      $scope.branch = branch;
      if (branch.type === "event") {
        let id = branch.id;
        $http.get('/api/datainterface/' + branch.event.diid).success(function (data) {
          if (data.length !== 0) {
            let propertiesOfDatainterfaceDataFromDB = JSON.parse(data[0].properties);
            $scope.userFieldsFromDB = propertiesOfDatainterfaceDataFromDB.userFields;
          }
        });
        _getHistory(id);
      } else {
        let array = [];
        $scope.eventsList = [];
        if (branch.children) {
          array = branch.children;
        }
        for (let i = 0; i < array.length; i++) {
          if (array[i].type === "event") {
            $scope.eventsList.push(array[i].event);
          } else if (array[i].type === "type" && array[i].children) {
            array = array.concat(array[i].children);
          }
        }
        for (let i = 0; i < $scope.eventsList.length; i++) {
          let result = JSON.parse($scope.eventsList[i].PROPERTIES);
          if (result && result.props) {
            for (let j = 0; j < result.props.length; j++) {
              if (result.props[j].pname === "period") {
                let tmp = JSON.parse(result.props[j].pvalue);
                $scope.eventsList[i].startDate = tmp.startDate;
                $scope.eventsList[i].endDate = tmp.endDate;
                break;
              }
            }
          }
        }
        $scope.defaultConfigTableParams = new NgTableParams({ 'count': '20' }, { counts: [], dataset: $scope.eventsList });
      }
    };

    $scope.changeStatus = (status) => {
      if ($scope.branch.type === "type") {
        // In this case, we should operate on all events in evnetsList;
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'eventsOperateStatisticInfo.html',
          size: 'lg',
          backdrop: 'static',
          scope: $scope,
          controller: ['$scope', 'Notification', function ($scope, Notification) {
            $scope.numberStartedEvents = 0;
            $scope.startedEvents = [];
            $scope.numberStoppedEvents = 0;
            $scope.stoppedEvents = [];
            if ($scope.eventsList) {
              $scope.eventsList.forEach((event) => {
                if (event.status === 0) {
                  $scope.numberStoppedEvents++;
                  $scope.stoppedEvents.push(event);
                } else {
                  $scope.numberStartedEvents++;
                  $scope.startedEvents.push(event);
                }
              });
            }
            if (status === 0) {
              if ($scope.numberStartedEvents === 0) {
                $scope.summaryMessage = $filter('translate')('ocsp_web_events_noeventscanbestopped');
              } else {
                $scope.summaryMessage = $filter('translate')('ocsp_web_events_youwillstop') + $scope.numberStartedEvents + $filter('translate')('ocsp_web_events_numberofeventsstarted');
              }
            } else {
              if ($scope.numberStoppedEvents === 0) {
                $scope.summaryMessage = $filter('translate')('ocsp_web_events_noeventscanbestarted');
              } else {
                $scope.summaryMessage = $filter('translate')('ocsp_web_events_youwillstart') + $scope.numberStoppedEvents + $filter('translate')('ocsp_web_events_numberofeventsstopped');
              }
            }
            $scope.stoppedEventsNames = "";
            $scope.startedEventsNames = "";
            $scope.stoppedEvents.forEach((event) => {
              $scope.stoppedEventsNames = $scope.stoppedEventsNames + event.name + ",";
            });
            $scope.stoppedEventsNames = $scope.stoppedEventsNames.substring(0, $scope.stoppedEventsNames.length - 1);
            $scope.startedEvents.forEach((event) => {
              $scope.startedEventsNames = $scope.startedEventsNames + event.name + ",";
            });
            $scope.startedEventsNames = $scope.startedEventsNames.substring(0, $scope.startedEventsNames.length - 1);

            $scope.closeModal = function () {
              modal.close();
            };
            $scope.operateEvents = function () {
              if ((status === 0 && $scope.numberStartedEvents === 0) || (status === 1 && $scope.numberStoppedEvents === 0)) {
                $scope.closeModal();
              } else {
                $http.post("/api/event/changeevents/", { events: $scope.eventsList, status: status }).success(function () {
                  $scope.closeModal();
                  _init();
                  Notification.success($filter('translate')('ocsp_web_common_026'));
                });
              }
            };
          }]
        });

      } else {
        $http.post("/api/event/change/" + $scope.branch.id, { status: status }).success(function () {
          _init();
          Notification.success($filter('translate')('ocsp_web_common_026'));
        });
      }
    };

    $scope.rightSlide = () => {
      if ($scope.hook + 4 < $scope.history.length) {
        $scope.history[$scope.hook].hide = true;
        $scope.history[$scope.hook + 4].hide = false;
        $scope.hook++;
      }
    };

    $scope.leftSlide = () => {
      if ($scope.hook > 0) {
        $scope.history[$scope.hook - 1].hide = false;
        if ($scope.hook + 3 < $scope.history.length) {
          $scope.history[$scope.hook + 3].hide = true;
        }
        $scope.hook--;
      }
    };

    $scope.pressClick = (record) => {
      if (!record.active) {
        _parseItem(record);
        if ($scope.history.length > 0) {
          for (let i in $scope.history) {
            $scope.history[i].active = false;
          }
        }
        record.active = true;
      }
    };

    $scope.auditTypes = [
      { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
      { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
      { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
      { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
    ];

    $scope.auditTimes = [
      { name: 'none', displayName: '无' },
      { name: 'have', displayName: '有' }
    ];

    $scope.remove = function (array, $index) {
      array.splice($index, 1);
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

    let _trim = function (stringdata) {
      return stringdata.replace(/(^\s*)|(\s*$)/g, '');
    };

    $scope.updateFormDirtyStatus = function () {

      let orgItem = JSON.parse(JSON.stringify($scope.oldItem));
      let newItem = JSON.parse(JSON.stringify($scope.item));
      if (_trim(orgItem.note) === _trim(newItem.note)) {
        delete orgItem.note;
        delete newItem.note;
        $scope.isMainFormDataChanged = JSON.stringify(orgItem) !== JSON.stringify(newItem);
      } else {
        $scope.isMainFormDataChanged = true;
      }
    };

    $scope.isUpdatedOutputFieldsValid = true;
    $scope.isUpdatedOutputFieldsValidMessages = "";
    $scope.checkUpdateOutputFileds = function (item, userFieldsFromDB) {
      $scope.isMainFormDataChanged = JSON.stringify($scope.oldItem) !== JSON.stringify($scope.item);
      let invalidOuptuFields = [];

      if (!!item.select_expr) {
        let existsFields = [];
        if (item && item.inputFields) {
          existsFields = item.inputFields.split(',');
        }
        if (userFieldsFromDB !== undefined && userFieldsFromDB !== null) {
          existsFields.concat(userFieldsFromDB.map((x) => x.pname));
          userFieldsFromDB.forEach((x) => { existsFields.push(x.pname); });
        }

        let labels = $scope.item.labels;
        if (labels !== undefined) {
          for (let i in labels) {
            if (labels[i].properties !== undefined) {
              let items = JSON.parse(labels[i].properties);
              if (items && items.labelItems && items.labelItems.length > 0) {
                for (let j in items.labelItems) {
                  existsFields.push(items.labelItems[j].pvalue);
                }
              }
            }
          }
        }

        let outputFields = item.select_expr.split(',');

        for (let idx in outputFields) {
          let tmpExistCheck = false;
          for (let innerIdx in existsFields) {
            if ($scope.trimStr(outputFields[idx]) === $scope.trimStr(existsFields[innerIdx])) {
              tmpExistCheck = true;
              break;
            }
          }
          if (!tmpExistCheck) {
            invalidOuptuFields.push(outputFields[idx]);
          }
        }

        if (invalidOuptuFields.length !== 0) {
          $scope.isUpdatedOutputFieldsValid = false;
          $scope.isUpdatedOutputFieldsValidMessages = invalidOuptuFields.join(',') + $translate.instant('ocsp_web_common_035');
        } else {
          $scope.isUpdatedOutputFieldsValid = true;
          $scope.isUpdatedOutputFieldsValidMessages = "";
        }
      } else {
        $scope.isUpdatedOutputFieldsValid = true;
        $scope.isUpdatedOutputFieldsValidMessages = "";
      }

    };

    $scope.update = function () {
      $scope.isMainFormDataChanged = false;

      if ($scope.item.id === undefined || $scope.item.id === null) {
        Notification.error("Cannot update null event");
      } else {
        if ($scope.mainForm.$invalid) {
          angular.forEach($scope.mainForm.$error, function (field) {
            angular.forEach(field, function (errorField) {
              errorField.$setTouched();
            });
          });
          Notification.error($filter('translate')('ocsp_web_common_032'));
        } else {
          if ($scope.item.note) {
            $scope.item.note = $scope.item.note.replace(/[<p>|</p>]/g, "");
            $scope.item.note = `<p>${$scope.item.note}</p>`;
          }
          let itemId = $scope.item.id;
          $q.all({
            event: $http.put("/api/event/" + $scope.item.id, { event: $scope.item }),
            history: $http.post("/api/history/event", { event: { config_data: $scope.item, note: $scope.item.note, version: $scope.item.version } })
          })
            .then(function () {
              _init();
              _getHistory(itemId);
              Notification.success($filter('translate')('ocsp_web_common_026'));
            });
        }
      }
    };

    $scope.selectStream = function ($item) {
      _parseFields($item.diid, $scope.item);
    };

    $scope.getAllPossibleFields = function (fields, userFields) {
      let resultStr = fields;
      if (userFields !== undefined && userFields !== null) {
        userFields.forEach((x) => { resultStr += "," + x.pname; });
      }
      return resultStr;
    };

  }]);
