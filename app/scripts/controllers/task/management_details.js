'use strict';

/**
 * For job management main page controller
 */
angular.module('ocspApp')
  .controller('TaskManagementDetailsCtrl', ['$scope', '$rootScope', '$routeParams', '$http', '$q', '$filter', 'Notification', 
    'strService', 'moment', '$interval','globalDataService',
    function ($scope, $rootScope, $routeParams, $http, $q, $filter, Notification, 
      strService, moment, $interval,globalDataService) {
      $rootScope.init('task');

      var currentStreamId = $routeParams.id;
      $scope.currentStreamDetails = {};

      $scope.firstColumnWidthClass = "uk-width-1-5";
      $scope.secondColumnWidthClass = "uk-width-3-5";
      $scope.thirdColumnWidthClass = "uk-width-1-5";

      //i18n
      $scope.localLang = globalDataService.localLang;
      $scope.isAdminUser = $rootScope.isAdmin();
      $scope.currentStreamType = "SPARK";
      $scope.cep = $rootScope.cep;
      $scope.streamEditable = false;

      $scope.links = [];
      $scope.datasourcecount = 1;
      globalDataService.getLinks().then(data => $scope.links = data );
      globalDataService.getDataSourceCount().then( data => $scope.datasourcecount = parseInt(data.value) );

      $scope.eventOuputChartOptions = {
        scales: {
          yAxes: [
            {
              borderWidth: 100,
              id: 'y-axis-1',
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

      $scope.chartRunTimeDataOptions = {
        scales: {
          yAxes: [
            {
              id: 'y-axis-2',
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

      $scope.handledDataAndLostDataOptions = {
        legend: { display: true },
        scales: {
          yAxes: [
            {
              id: 'y-axis-2',
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                beginAtZero: true,
              }
            }
          ]
        }
      };

      // Global timer
      let setupIntervalUpdateTask = function (engineType) {
        let updateTaskOrJobStatusIntervalService = $interval(function () {
          let fetchCurrentStreamStatus = null;
          if(engineType==='SPARK'){
            fetchCurrentStreamStatus = globalDataService.getTaskStatusByID($scope.selectedJob.id);
          }else{
            fetchCurrentStreamStatus = globalDataService.getJobStatusByID($scope.selectedJob.id);
          }
          let updateTaskStatusUrl = '/api/task/status/' + $scope.selectedJob.id;
          if (engineType !== 'SPARK') {
            updateTaskStatusUrl = '/api/job/status/' + $scope.selectedJob.id;
          }
          $http.get(updateTaskStatusUrl).success(function (targetTask) {
            if (targetTask) {
              $scope.selectedJob.status = targetTask.status;
              $scope.selectedJob.running_time = targetTask.running_time;
            }
          }).error(function (err) {
            console.error(err);
          });
          if ($scope.selectedJob.status === "STOPPED") {
            $scope.selectedJob.status = 0;
          }
          if ($scope.selectedJob.status === "RUNNING") {
            $scope.selectedJob.status = 2;
          }
        }, 5000);
        globalDataService.registIntervalService(updateTaskOrJobStatusIntervalService);
      };

      $scope.clickOnEvent = function (params) {
        if (params) {
          $scope.selectedEventId = $scope.event_ids[params.dataIndex];
          $scope.selectedEventName = $scope.event_names[params.dataIndex];
          $http.get('/api/chart/eventsummary/' + $scope.selectedEventId).success((data) => {
            $scope.event_detail_times = data.times;
            $scope.event_detail_records = data.event_details;
            $scope.showItem = "eventdetails";
          });
        }
      };

      var fetchStreamDetails = function (currentStreamId) {
        $q.all({
          streamData: $http.get('/api/tasksjobs/' + currentStreamId),
          datasource: $http.get('/api/datasource'),
          labels: $http.get('/api/label')
        }).then(function (arr) {

          $scope.currentStreamType = arr.streamData.data.enginetype;
          setupIntervalUpdateTask($scope.currentStreamType);

          $scope.selectedStreamName = arr.streamData.data.name;

          $scope.event_names = [];
          $scope.event_ids = [];
          $scope.event_records = [];
          $scope.showItem = "onestreamsummary";
          $scope.event_records_shadow = [];
          $scope.lastTimestampForEvent = moment(new Date()).format('YYYY-MM-DD h:mm:ss');

          $scope.eventStaticOutput = {
            title: {
              text: $filter('translate')('ocsp_web_event_statistics') + $scope.lastTimestampForEvent
            },
            legend: {
              data: ['']
            },
            xAxis: {
              data: $scope.event_names,
              
            },
            yAxis: {
              axisLine: {
                  show: false
              },
              axisTick: {
                  show: false
              },
              axisLabel: {
                  textStyle: {
                      color: '#999'
                  }
              }
            },
            series: [
              {
                type: 'bar',
                barGap: '-100%',
                itemStyle: {
                  normal: { color: 'rgba(0,0,0,0.05)' }
                },
                barCategoryGap: '40%',
                data: $scope.event_records_shadow,
                animation: false
              },
              {
                name: 'test',
                type: 'bar',
                data: $scope.event_records
              }
            ]
          };

          if ($scope.currentStreamType === 'SPARK') {
            $http.get('/api/chart/summary/' + currentStreamId).success((data) => {
              $scope.latesttime = data.latesttime;
              if ($scope.latesttime && $scope.latesttime.length > 0) {
                $scope.lastTimestampForEvent = moment($scope.latesttime[0]).format('YYYY-MM-DD h:mm:ss');
              }
              $scope.event_names = data.names;
              $scope.event_ids = data.eventsIDs;
              $scope.event_records = data.event_records;
              let maxValue = 1;
              $scope.event_records.forEach((item)=>{
                if(item > maxValue){
                  maxValue = item;
                }
              });
              $scope.event_records.forEach(()=>{
                $scope.event_records_shadow.push(maxValue);
              });

              $scope.eventStaticOutput = {
                title: {
                  text: $filter('translate')('ocsp_web_event_statistics') + $scope.lastTimestampForEvent
                },
                legend: {
                  data: ['']
                },
                xAxis: {
                  data: $scope.event_names,
                  
                },
                yAxis: {
                  axisLine: {
                      show: false
                  },
                  axisTick: {
                      show: false
                  },
                  axisLabel: {
                      textStyle: {
                          color: '#999'
                      }
                  }
                },
                series: [
                  {
                    type: 'bar',
                    barGap: '-100%',
                    itemStyle: {
                      normal: { color: 'rgba(0,0,0,0.05)' }
                    },
                    barCategoryGap: '40%',
                    data: $scope.event_records_shadow,
                    animation: false
                  },
                  {
                    name: 'test',
                    type: 'bar',
                    data: $scope.event_records
                  }
                ]
              };
            });
          }

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
          $scope.changeItem(arr.streamData.data);
        });
      };

      fetchStreamDetails(currentStreamId);

      $scope.goto = function (newPage) {
        $scope.showItem = newPage;
      };

      $scope.tab = "summary";
      $scope.changeTab = function (name) {
        $scope.tab = name;
      };

      $scope.currentConfigBlock = "basicConfig";

      $scope.switchToBlock = function (newConfigBlock) {
        $scope.currentConfigBlock = newConfigBlock;
      };

      function _parseDatasource(dataInterface) {
        for (let i in $scope.datasources) {
          if ($scope.datasources[i].id === dataInterface.dsid) {
            dataInterface.datasource = $scope.datasources[i];
            break;
          }
        }
      }

      //Basic functions for page operation
      function _parseProperties(datainterface, prop, type = "output") {
        if (datainterface.delim === "\\|") {
          datainterface.delim = "|";
        }
        datainterface.inputs = [];
        // datainterface.customParamsKV = [];
        if (prop !== undefined && prop !== null) {
          prop = JSON.parse(prop);
          datainterface.userFields = prop.userFields;
          if (prop.fields !== undefined && prop.fields.length > 0) {
            datainterface.fields = "";
            if (prop.fields.length > 0) {
              datainterface.fields = prop.fields[0].pname;
            }
            for (let i = 1; i < prop.fields.length; i++) {
              if (prop.fields[i].pname !== undefined && prop.fields[i].pname.trim() !== "") {
                datainterface.fields += "," + prop.fields[i].pname;
              }
            }
          }
          if (prop.props !== undefined && prop.props.length > 0) {
            for (let i in prop.props) {
              if (prop.props[i].pname === "topic") {
                datainterface.topic = prop.props[i].pvalue;
              }
              else if (prop.props[i].pname === "codisKeyPrefix") {
                datainterface.codisKeyPrefix = prop.props[i].pvalue;
              }
              else if (prop.props[i].pname === "uniqKeys") {
                datainterface.uniqueKey = prop.props[i].pvalue;
              }
              else if (prop.props[i].pname === "group.id") {
                datainterface.groupid = prop.props[i].pvalue;
              } else {
                // datainterface.customParamsKV.push(prop.props[i]);
              }
            }
          }
          if (prop.sources !== undefined && prop.sources.length > 0 && type === "input") {
            for (let i = 0; i < prop.sources.length; i++) {
              let result = {
                topic: prop.sources[i].topic,
                name: prop.sources[i].pname,
                delim: prop.sources[i].delim === "\\|" ? "|" : prop.sources[i].delim,
                fields: "",
                userFields: []
              };
              if (prop.sources[i].fields !== undefined && prop.sources[i].fields.length > 0) {
                if (prop.sources[i].fields.length > 0) {
                  result.fields = prop.sources[i].fields[0].pname;
                }
                for (let j = 1; j < prop.sources[i].fields.length; j++) {
                  if (prop.sources[i].fields[j].pname !== undefined && prop.sources[i].fields[j].pname.trim() !== "") {
                    result.fields += "," + prop.sources[i].fields[j].pname;
                  }
                }
              }
              if (prop.sources[i].userFields !== undefined && prop.sources[i].userFields.length > 0) {
                for (let j = 0; j < prop.sources[i].userFields.length; j++) {
                  result.userFields.push({
                    name: prop.sources[i].userFields[j].pname,
                    value: prop.sources[i].userFields[j].pvalue
                  });
                }
              }
              datainterface.inputs.push(result);
            }
          }
        }
      }

      function _dealWith(status) {
        const getButtonStatusByStreamStatus = function (status) {
          switch (status) {
            case 0:
              return [true, false, false, true];
            case 2:
              return [false, true, true, false];
            case 5:
              return [false, true, false, false];
            default:
              return [false, false, false, false];
          }
        };
        if (status === "delete") {
          if ($scope.selectedJob && $scope.jobs) {
            let i;
            for (i in $scope.jobs) {
              if ($scope.jobs[i].id === $scope.selectedJob.id) {
                break;
              }
            }
            if (i < $scope.jobs.length) {
              $scope.jobs.splice(i, 1);
            }
          }
        } else {
          $scope.actions = [
            { name: $filter('translate')('ocsp_web_streams_manage_024'), enable: getButtonStatusByStreamStatus(status)[0], icon: "glyphicon glyphicon-play success" },
            { name: $filter('translate')('ocsp_web_streams_manage_025'), enable: getButtonStatusByStreamStatus(status)[1], icon: "glyphicon glyphicon-stop" }
          ];
          if ($scope.selectedJob.enginetype === 'SPARK') {
            $scope.actions.push({ name: $filter('translate')('ocsp_web_streams_manage_026'), enable: getButtonStatusByStreamStatus(status)[2], icon: "glyphicon glyphicon-refresh" });
          }
          $scope.actions.push({ name: $filter('translate')('ocsp_web_streams_manage_027'), enable: getButtonStatusByStreamStatus(status)[3], icon: "glyphicon glyphicon-remove-sign warning" });
        }
      }

      function _drawGraph(item, labels) {
        let graphDefinition = 'graph LR;';
        graphDefinition += "task[" + item.name + "];";
        let last = "task";
        if (item.input.inputs.length > 0) {
          graphDefinition += "subgraph  " + $filter('translate')('ocsp_web_streams_manage_038') + ";";
          for (let i = 0; i < item.input.inputs.length; i++) {
            graphDefinition += `${item.input.inputs[i].name}(("${item.input.inputs[i].name}"));`;
          }
          graphDefinition += "end;";
          for (let i = 0; i < item.input.inputs.length; i++) {
            graphDefinition += `task --> ${item.input.inputs[i].name};`;
          }
        }
        if (labels.length > 0) {
          graphDefinition += "subgraph " + $filter('translate')('ocsp_web_common_024') + ";";
          if (labels.length > 1) {
            for (let i = 0; i < labels.length - 1; i++) {
              graphDefinition += labels[i].name + "-->" + labels[i + 1].name + ";";
            }
          } else {
            graphDefinition += labels[0].name + ";";
          }
          graphDefinition += "end;";
          for (let i = 0; i < item.input.inputs.length; i++) {
            graphDefinition += `${item.input.inputs[i].name} --> ${labels[0].name};`;
          }
          if (labels.length > 1) {
            last = labels[labels.length - 1].name;
          } else {
            last = labels[0].name;
          }
        } else { // Contain no labels
          graphDefinition += "subgraph " + $filter('translate')('ocsp_web_common_024') + ";";
          graphDefinition += "null(" + $filter('translate')('ocsp_web_common_036') + ");";
          graphDefinition += "style null fill:#6D6D65,stroke:#6D6D65,stroke-width:0px;";
          graphDefinition += "end;";
          for (let i = 0; i < item.input.inputs.length; i++) {
            graphDefinition += `${item.input.inputs[i].name} --> null;`;
          }
          last = "null";
        }
        if (item.events.length > 0) {
          graphDefinition += "subgraph " + $filter('translate')('ocsp_web_common_025') + ";";
          for (let j in item.events) {
            if (item.events[j].output === undefined) {
              graphDefinition += `${item.events[j].name}(("${item.events[j].name}"));`;
            } else {
              if (item.events[j].status === 0) {
                graphDefinition += `style ${item.events[j].name} fill:#7d7d7d,stroke:#81b1db,stroke-width:0px;`;
              }
              if (item.events[j].output.topic !== undefined) {
                graphDefinition += `${item.events[j].name}(("${item.events[j].name}(${item.events[j].output.topic})"));`;
              } else {
                graphDefinition += `${item.events[j].name}(("${item.events[j].name}"));`;
              }
            }
          }
          graphDefinition += "end;";
          for (let j in item.events) {
            graphDefinition += last + "-->" + item.events[j].name + ";";
          }
        }
        let element = document.querySelector("#mermaid");
        if (!!element && !!element.innerHTML) {
          element.innerHTML = " ";
        }
        let insertSvg = function (svgCode) {
          if (!!element && !!element.innerHTML) {
            element.innerHTML = svgCode;
          }
        };
        mermaidAPI.render('graphDiv', graphDefinition, insertSvg);
      }

      function _graphs(charts) {
        $scope.chartSeries0 = [$filter('translate')('ocsp_web_dashboard_reserved')];
        $scope.chartSeries1 = [$filter('translate')('ocsp_web_dashboard_dropped')];
        $scope.chartData0 = [charts.dealData[0]];
        $scope.chartData1 = [charts.dealData[1]];
        $scope.chartRunTimeSeries = [$filter('translate')('ocsp_web_dashboard5')];
        $scope.chartRunTimeLabels = [];
        $scope.chartRunTimeData = charts.batchtime;
        $scope.chartMemorySeries = [$filter('translate')('ocsp_web_dashboard_memory_used'), $filter('translate')('ocsp_web_dashboard_memory_available')];
        $scope.chartMemoryData = charts.mem_storage;
        for (let i in charts.runtimetimestamps) {
          $scope.chartRunTimeLabels.push(moment(charts.runtimetimestamps[i]).format('YYYY-MM-DD HH:mm:ss'));
        }
      }

      $scope.addNewItemIntoLabelsInCaseIstevenFailedDoIt = function (newItem) {
        // The newItem is selected:
        if (newItem && newItem.tick2) {
          if (!$scope.selectedJob.labels) {
            $scope.selectedJob.labels = [newItem];
          } else {
            let isNewItemAddedIntoLabels = false;
            $scope.selectedJob.labels.forEach((item) => {
              if (item.id === newItem.id) {
                isNewItemAddedIntoLabels = true;
              }
            });
            if (!isNewItemAddedIntoLabels) {
              $scope.selectedJob.labels.push(newItem);
            }
          }
        }
      };

      $scope.statusText = function (item) {
        switch (item) {
          case 0:
            return $filter('translate')('ocsp_web_streams_manage_032');
          case 1:
            return $filter('translate')('ocsp_web_streams_manage_033');
          case 2:
            return $filter('translate')('ocsp_web_streams_manage_034');
          case 3:
            return $filter('translate')('ocsp_web_streams_manage_035');
          case 4:
            return $filter('translate')('ocsp_web_streams_manage_036');
          case 5:
            return $filter('translate')('ocsp_web_streams_manage_044');
        }
      };

      $scope.isPageEditable = function () {
        return !$scope.isAdminUser && $scope.streamEditable;
      };

      $scope.selectedRecoverMode = function (str) {
        if ($scope.isPageEditable() === true) {
          $scope.selectedJob.recover_mode = str;
        }
      };


      function isValueInArray(val, arr, propertyName) {
        let result = false;
        if (arr) {
          arr.forEach((item) => {
            if (item === val[propertyName]) {
              result = true;
            }
          });
        }
        return result;
      }

      function _extractAdvancedProperties(events) {
        let specialPropertyNames = ['period', 'userKeyIdx'];
        if (events) {
          events.forEach((event) => {
            event.customParamsKV = [];
            if (event.PROPERTIES && event.PROPERTIES.props) {
              event.PROPERTIES.props.forEach((oneEventProperty) => {
                if (!isValueInArray(oneEventProperty, specialPropertyNames, 'pname')) {
                  event.customParamsKV.push(oneEventProperty);
                }
              });
            }
          });
        }
      }

      function _extractAdvancedPropertiesOfInput(input) {
        let specialPropertyNames = ['period', 'userKeyIdx', 'group.id', 'uniqKeys'];
        if (input.properties) {
          input.PROPERTIES = JSON.parse(input.properties);
          input.customParamsKV = [];
          input.PROPERTIES.props.forEach((oneEventProperty) => {
            if (!isValueInArray(oneEventProperty, specialPropertyNames, 'pname')) {
              input.customParamsKV.push(oneEventProperty);
            }
          });
        }
      }

      $scope.changeItem = function (item) {
        $scope.selectedJob = item;
        if (item.enginetype === 'SPARK') {
          $q.all({
            datainterface: $http.get('/api/datainterface/' + item.diid),
            labels: $http.get('/api/label/diid/' + item.diid),
            outputinterface: $http.get('/api/datainterface/output'),
            events: $http.get('/api/event/diid/' + item.diid),
            charts: $http.get('/api/chart/taskData/' + item.id)
          })
            .then(function (arr) {
              $scope.selectedJob.input = arr.datainterface.data[0];
              $scope.selectedJob.output = arr.outputinterface.data;
              $scope.selectedJob.events = arr.events.data;
              $scope.selectedJob.labels = [];
              $scope.selectedJob.events.forEach(item => {
                item.outputFieldsInvalid = false;
                item.outputFieldsInvalidMessage = "";
              });
              let labels = [];
              //Deal with input properties
              _parseDatasource($scope.selectedJob.input);
              _parseProperties($scope.selectedJob.input, $scope.selectedJob.input.properties, "input");
              //Deal with labels
              for (let j in $scope.inputLabels) {
                $scope.inputLabels[j].tick2 = false;
              }
              for (let i in arr.labels.data) {
                for (let j in $scope.inputLabels) {
                  if (arr.labels.data[i].label_id === $scope.inputLabels[j].id) {
                    $scope.inputLabels[j].tick2 = true;
                    labels.push($scope.inputLabels[j]);
                    $scope.selectedJob.labels.push($scope.inputLabels[j]);
                  }
                }
              }
              let temp = $scope.inputLabels;
              $scope.inputLabels = [];
              for (let j in labels) {
                $scope.inputLabels.push(labels[j]);
              }
              for (let i in temp) {
                let flag = true;
                for (let j in labels) {
                  if (temp[i].id === labels[j].id) {
                    flag = false;
                    break;
                  }
                }
                if (flag) {
                  $scope.inputLabels.push(temp[i]);
                }
              }
              //Deal with events
              for (let i in $scope.selectedJob.events) {
                if ($scope.selectedJob.events[i].PROPERTIES !== undefined && $scope.selectedJob.events[i].PROPERTIES !== null) {
                  $scope.selectedJob.events[i].PROPERTIES = JSON.parse($scope.selectedJob.events[i].PROPERTIES);
                  if ($scope.selectedJob.events[i].PROPERTIES.props !== undefined && $scope.selectedJob.events[i].PROPERTIES.props.length > 0) {
                    for (let j in $scope.selectedJob.events[i].PROPERTIES.props) {
                      if ($scope.selectedJob.events[i].PROPERTIES.props[j].pname === "userKeyIdx") {
                        $scope.selectedJob.events[i].userKeyIdx = $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue;
                      }
                      if ($scope.selectedJob.events[i].PROPERTIES.props[j].pname === "period") {
                        $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue = JSON.parse($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue);
                        $scope.selectedJob.events[i].audit = {
                          type: $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.period,
                          periods: []
                        };
                        if ($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.startDate && $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.endDate) {
                          $scope.selectedJob.events[i].audit.enableDate = "have";
                          $scope.selectedJob.events[i].audit.enableDateForSwitchButton = true;
                          $scope.selectedJob.events[i].auditTypes = [
                            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                          ];

                          $scope.selectedJob.events[i].audit.startDate = moment($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.startDate).toDate();
                          $scope.selectedJob.events[i].audit.endDate = moment($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.endDate).toDate();

                        } else {
                          $scope.selectedJob.events[i].audit.enableDate = "none";
                          $scope.selectedJob.events[i].audit.enableDateForSwitchButton = false;
                          $scope.selectedJob.events[i].auditTypes = [
                            { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
                            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                          ];
                        }
                        // $scope.selectedJob.events[i].audit.type =  'always';
                        for (let w in $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.time) {
                          let val = $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.time[w];
                          let currStartDate, currEndDate;
                          if (val.begin.d.match(/\d+-\d+-\d+/g) && val.end.d.match(/\d+-\d+-\d+/g)) {
                            currStartDate = moment(val.begin.d + " " + val.begin.h).toDate();
                            currEndDate = moment(val.end.d + " " + val.end.h).toDate();
                          } else {
                            currStartDate = moment("2010-07-01 " + val.begin.h).toDate();
                            currEndDate = moment("2010-07-01 " + val.end.h).toDate();
                          }
                          $scope.selectedJob.events[i].audit.periods.push({
                            s: val.begin.d,
                            d: val.end.d,
                            start: currStartDate,
                            end: currEndDate
                          });
                        }
                      } else {
                        $scope.selectedJob.events[i].auditTypes = [
                          { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
                          { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                          { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                          { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                          { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                        ];
                      }
                      if ($scope.selectedJob.events[i].PROPERTIES.props.length === 1 && $scope.selectedJob.events[i].PROPERTIES.props[0].pname !== "period") {
                        $scope.selectedJob.events[i].audit = { type: "always", periods: [], enableDate: "none" };
                      }
                    }

                    if ($scope.selectedJob.events[i].PROPERTIES.output_dis !== undefined && $scope.selectedJob.events[i].PROPERTIES.output_dis[0] !== undefined) {
                      $scope.selectedJob.events[i].interval = $scope.selectedJob.events[i].PROPERTIES.output_dis[0].interval;
                      $scope.selectedJob.events[i].delim = $scope.selectedJob.events[i].PROPERTIES.output_dis[0].delim;
                      if ($scope.selectedJob.events[i].delim === "\\|") {
                        $scope.selectedJob.events[i].delim = "|";
                      }
                      for (let j in $scope.selectedJob.output) {
                        if ($scope.selectedJob.output[j].id === parseInt($scope.selectedJob.events[i].PROPERTIES.output_dis[0].diid)) {
                          $scope.selectedJob.events[i].output = $scope.selectedJob.output[j];
                          _parseProperties($scope.selectedJob.events[i].output, $scope.selectedJob.events[i].output.properties);
                          _parseDatasource($scope.selectedJob.events[i].output);
                          break;
                        }
                      }
                    }
                  } else {
                    console.log('ERROR 2!');
                  }
                } else {
                  console.log("ERROR 1!");
                }
              }
              _dealWith($scope.selectedJob.status);
              _drawGraph($scope.selectedJob, labels);
              _graphs(arr.charts.data);
              _extractAdvancedProperties($scope.selectedJob.events);
              _extractAdvancedPropertiesOfInput($scope.selectedJob.input);
            });
        }
        else if (item.enginetype === 'STORM') {
          $q.all({
            datainterface: $http.get('/api/datainterface/' + item.diid_fk),
            labels: $http.get('/api/label/diid/' + item.diid_fk),
            outputinterface: $http.get('/api/datainterface/output'),
            events: $http.get('/api/event/diid/' + item.diid_fk),
            sysconfig: $http.get('/api/sysconfig/' + item.sys_fk),
            charts: $http.get('/api/chart/stormData/' + item.id)
          })
            .then(function (arr) {
              $scope.selectedJob.input = arr.datainterface.data[0];
              $scope.selectedJob.output = arr.outputinterface.data;
              $scope.selectedJob.events = arr.events.data;
              $scope.selectedJob.labels = [];
              $scope.selectedJob.events.forEach(item => {
                item.outputFieldsInvalid = false;
                item.outputFieldsInvalidMessage = "";
              });
              $scope.selectedJob.sysConfigureProps = JSON.parse(arr.sysconfig.data.config);
              let labels = [];
              //Deal with input properties
              _parseDatasource($scope.selectedJob.input);
              _parseProperties($scope.selectedJob.input, $scope.selectedJob.input.properties, "input");
              //Deal with labels
              for (let j in $scope.inputLabels) {
                $scope.inputLabels[j].tick2 = false;
              }
              for (let i in arr.labels.data) {
                for (let j in $scope.inputLabels) {
                  if (arr.labels.data[i].label_id === $scope.inputLabels[j].id) {
                    $scope.inputLabels[j].tick2 = true;
                    labels.push($scope.inputLabels[j]);
                    $scope.selectedJob.labels.push($scope.inputLabels[j]);
                  }
                }
              }
              let temp = $scope.inputLabels;
              $scope.inputLabels = [];
              for (let j in labels) {
                $scope.inputLabels.push(labels[j]);
              }
              for (let i in temp) {
                let flag = true;
                for (let j in labels) {
                  if (temp[i].id === labels[j].id) {
                    flag = false;
                    break;
                  }
                }
                if (flag) {
                  $scope.inputLabels.push(temp[i]);
                }
              }
              //Deal with events
              for (let i in $scope.selectedJob.events) {
                if ($scope.selectedJob.events[i].PROPERTIES !== undefined && $scope.selectedJob.events[i].PROPERTIES !== null) {
                  $scope.selectedJob.events[i].PROPERTIES = JSON.parse($scope.selectedJob.events[i].PROPERTIES);
                  if ($scope.selectedJob.events[i].PROPERTIES.props !== undefined && $scope.selectedJob.events[i].PROPERTIES.props.length > 0) {
                    for (let j in $scope.selectedJob.events[i].PROPERTIES.props) {
                      if ($scope.selectedJob.events[i].PROPERTIES.props[j].pname === "userKeyIdx") {
                        $scope.selectedJob.events[i].userKeyIdx = $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue;
                      }
                      if ($scope.selectedJob.events[i].PROPERTIES.props[j].pname === "period") {
                        $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue = JSON.parse($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue);
                        $scope.selectedJob.events[i].audit = {
                          type: $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.period,
                          periods: []
                        };
                        if ($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.startDate && $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.endDate) {
                          $scope.selectedJob.events[i].audit.enableDate = "have";
                          $scope.selectedJob.events[i].audit.enableDateForSwitchButton = true;
                          $scope.selectedJob.events[i].auditTypes = [
                            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                          ];

                          $scope.selectedJob.events[i].audit.startDate = moment($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.startDate).toDate();
                          $scope.selectedJob.events[i].audit.endDate = moment($scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.endDate).toDate();

                        } else {
                          $scope.selectedJob.events[i].audit.enableDate = "none";
                          $scope.selectedJob.events[i].audit.enableDateForSwitchButton = false;
                          $scope.selectedJob.events[i].auditTypes = [
                            { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
                            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                          ];
                        }
                        // $scope.selectedJob.events[i].audit.type =  'always';
                        for (let w in $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.time) {
                          let val = $scope.selectedJob.events[i].PROPERTIES.props[j].pvalue.time[w];
                          let currStartDate, currEndDate;
                          if (val.begin.d.match(/\d+-\d+-\d+/g) && val.end.d.match(/\d+-\d+-\d+/g)) {
                            currStartDate = moment(val.begin.d + " " + val.begin.h).toDate();
                            currEndDate = moment(val.end.d + " " + val.end.h).toDate();
                          } else {
                            currStartDate = moment("2010-07-01 " + val.begin.h).toDate();
                            currEndDate = moment("2010-07-01 " + val.end.h).toDate();
                          }
                          $scope.selectedJob.events[i].audit.periods.push({
                            s: val.begin.d,
                            d: val.end.d,
                            start: currStartDate,
                            end: currEndDate
                          });
                        }
                      } else {
                        $scope.selectedJob.events[i].auditTypes = [
                          { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
                          { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
                          { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
                          { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
                          { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
                        ];
                      }
                      if ($scope.selectedJob.events[i].PROPERTIES.props.length === 1) {
                        $scope.selectedJob.events[i].audit = { type: "always", periods: [], enableDate: "none" };
                      }
                    }

                    if ($scope.selectedJob.events[i].PROPERTIES.output_dis !== undefined && $scope.selectedJob.events[i].PROPERTIES.output_dis[0] !== undefined) {
                      $scope.selectedJob.events[i].interval = $scope.selectedJob.events[i].PROPERTIES.output_dis[0].interval;
                      $scope.selectedJob.events[i].delim = $scope.selectedJob.events[i].PROPERTIES.output_dis[0].delim;
                      if ($scope.selectedJob.events[i].delim === "\\|") {
                        $scope.selectedJob.events[i].delim = "|";
                      }
                      for (let j in $scope.selectedJob.output) {
                        if ($scope.selectedJob.output[j].id === parseInt($scope.selectedJob.events[i].PROPERTIES.output_dis[0].diid)) {
                          $scope.selectedJob.events[i].output = $scope.selectedJob.output[j];
                          _parseProperties($scope.selectedJob.events[i].output, $scope.selectedJob.events[i].output.properties);
                          _parseDatasource($scope.selectedJob.events[i].output);
                          break;
                        }
                      }
                    }
                  } else {
                    console.log('ERROR 2!');
                  }
                } else {
                  console.log("ERROR 1!");
                }
              }
              _dealWith($scope.selectedJob.status);
              _drawGraph($scope.selectedJob, labels);
              _graphs(arr.charts.data);
              _extractAdvancedProperties($scope.selectedJob.events);
              _extractAdvancedPropertiesOfInput($scope.selectedJob.input);
            });

        }
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

      $scope.remove = function (array, $index) {
        array.splice($index, 1);
      };

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

      $scope.add = function (array) {
        if (array !== undefined) {
          array.push({
            status: 1,
            output: {},
            userFields: []
          });
        }
      };

      $scope.generate = function (inputs, array) {
        let str = "";
        if (array !== undefined && array.length > 0) {
          let result = new Set();
          if (array[0].fields !== undefined && array[0].fields.trim() !== "") {
            result = new Set(strService.split(array[0].fields));
          }
          for (let i = 1; i < array.length; i++) {
            let tmp = new Set();
            if (array[i].fields !== undefined && array[i].fields.trim() !== "") {
              let splits = strService.split(array[i].fields);
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

      $scope.addNewEvent = function (array) {
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

      $scope.addUserField = function (input) {
        if (input.userFields === undefined || input.userFields === null) {
          input.userFields = [];
        }
        input.userFields.push({
          pname: "",
          pvalue: ""
        });
      };

      $scope.tick2 = false;

      $scope.saveStreamData = function () {
        if ($scope.selectedJob.id === undefined || $scope.selectedJob.id === null) {
          Notification.error("Cannot update null task");
          return false;
        } else if(angular.element(document).find('.tokenfield4checkvalidstatus .redtip:not(.ng-hide)').length !== 0){
          Notification.error($filter('translate')('ocsp_web_stream_pleasecheckfieldstatus'));
          return false;
        } else {
          if ($scope.streamconfigform.$invalid) {
            angular.forEach($scope.streamconfigform.$error, function (field) {
              angular.forEach(field, function (errorField) {
                errorField.$setTouched();
              });
            });
            Notification.error($filter('translate')('ocsp_web_common_032'));
            return false;
          }
          if ($scope.selectedJob.enginetype === 'SPARK') {
            $http.put("/api/task", { task: $scope.selectedJob }).success(function () {
              // update page data after save the original data
              fetchStreamDetails(currentStreamId);
              Notification.success($filter('translate')('ocsp_web_common_026'));
            });
            $scope.streamEditable = false;
            return true;
          } else if ($scope.selectedJob.enginetype === 'STORM') {
            $http.put("/api/job", { job: $scope.selectedJob }).success(function () {
              // update page data after save the original data
              fetchStreamDetails(currentStreamId);
              Notification.success($filter('translate')('ocsp_web_common_026'));
            });
            $scope.streamEditable = false;
            return true;
          } else {
            Notification.error('Unexpected stream engine type!');
            return false;
          }
        }
      };

      $scope.switchAuditPeriod = function (item) {
        if (!!item.audit.enableDateForSwitchButton) {
          item.audit.enableDate = "have";
          item.auditTypes = [
            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
          ];
        } else {
          item.audit.enableDate = "none";
          item.auditTypes = [
            { name: 'none', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_none') },
            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
          ];
        }
      };

      $scope.editStreamData = function () {
        $scope.streamEditable = true;
      };

      $scope.cancelEditStream = function () {
        $scope.streamEditable = false;
      };

    }]);
