'use strict';
/**
 * Confirmation Block Directive
 */
angular.module('ocspApp')
    .directive('ocspTopoInfoFormGroupInput', function () {
        return {
            // scope: false,
            scope: {
                bindModel: '=ngModel',
                disabled: '@'
            },
            restrict: 'AE',
            require: '^ngModel',
            priority: 2000,
            replace: true,
            transclude: true,
            link: function (scope, elem, attrs) {
                scope.name = attrs.labelname;
                scope.rowoneclass = (attrs.rowoneclass !== undefined && attrs.rowoneclass !== null) === true ? attrs.rowoneclass : 'col-md-4';
                scope.rowtwoclass = (attrs.rowtwoclass !== undefined && attrs.rowtwoclass !== null) === true ? attrs.rowtwoclass : 'col-md-8';
                scope.disabled = attrs.disabled;
            },
            template: `
                <div class="row">
                    <label>{{name}}</label>
                    <input type="text" class="form-control" ng-model="bindModel" ng-disabled={{disabled}} required>
                    <ng-transclude></ng-transclude>
                </div>
            `
        };
    })
    .directive('ocspTopoInfoTableRow', function () {
        return {
            // scope: false,
            scope: {
                bindModel: '=ngModel',
            },
            restrict: 'AE',
            require: '^ngModel',
            priority: 1800,
            replace: true,
            link: function (scope, elem, attrs) {
                scope.rowname = attrs.rowname;
            },
            template: `
            <tr>
                <td>{{rowname}}</td>
                <td>{{bindModel.id}}</td>
                <td><input ng-model="bindModel.maxTaskParallelism"></input></td>
                <td><input ng-model="bindModel.numberTasks"></input></td>
            </tr>
            `
        };
    })
    .directive('oscpStormBasicInfo', function () {
        return {
            scope: {
                selectedJob: '=ngModel',
                disabled: '@'
            },
            restrict: 'AE',
            controller: function ($scope) {
                $scope.selectedRecoverMode = function (str) {
                    $scope.selectedJob.recover_mode = str;
                };
            },
            template: `
                <div>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="{{'ocsp_web_common_011' | translate}}*" ng-model="selectedJob.name" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="numberOfWorkers" ng-model="selectedJob.sysConfigureProps.topo.numberOfWorkers" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="maxSpoutPending" ng-model="selectedJob.sysConfigureProps.topo.maxSpoutPending" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="numberOfAckers" ng-model="selectedJob.sysConfigureProps.topo.numberOfAckers" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig Groupid" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.groupid" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig Serializer" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.serializer" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig Id" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.id" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig Executors" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.executors" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig MaxTaskParallelism" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.maxTaskParallelism" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <ocsp-topo-info-form-group-input disabled="{{disabled}}" labelname="SpoutConfig NumberTasks" ng-model="selectedJob.sysConfigureProps.topo.spoutConfig.numberTasks" rowoneclass="col-md-2" rowtwoclass="col-md-8"></ocsp-topo-info-form-group-input>
                    <div class="form-group">
                    <div class="row">
                        <div class="col-md-2">
                            <label>Kafka offset*</label>
                        </div>
                        <div class="col-md-8">
                            <div class="btn-group" data-toggle="buttons">
                                <label class="btn btn-default" ng-class="{active: selectedJob.recover_mode !== 'from_last_stop'}" ng-click="selectedRecoverMode('from_latest')">
                                        <input ng-model="selectedJob.recover_mode" value="from_latest" type="radio">{{'ocsp_web_streams_from_latest'
                                        | translate}}
                                    </label>
                                <label class="btn btn-default" ng-class="{active: selectedJob.recover_mode === 'from_last_stop'}" ng-click="selectedRecoverMode('from_last_stop')">
                                        <input ng-model="selectedJob.recover_mode" value="from_last_stop" ng-readonly="isAdminUser" ng-disabled="isAdminUser"
                                               type="radio">{{'ocsp_web_streams_from_last_stop' | translate}}
                                    </label>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                <div class="row">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <td>Item Name</td>
                                <td>ID</td>
                                <td>Executors</td>
                                <td>MaxTaskParallelism</td>
                                <td>numberTasks</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Filter Bolt Config</td>
                                <td>{{selectedJob.sysConfigureProps.topo.filterBoltConfig.id}}</td>
                                <td><input ng-disabled="{{disabled || !streamEditable}}" ng-model="selectedJob.sysConfigureProps.topo.filterBoltConfig.executors"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.filterBoltConfig.maxTaskParallelism"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.filterBoltConfig.numberTasks"></input></td>
                            </tr>
                            <tr>
                                <td>Tag Bolt Config</td>
                                <td>{{selectedJob.sysConfigureProps.topo.tagBoltConfig.id}}</td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.tagBoltConfig.executors"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.tagBoltConfig.maxTaskParallelism"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.tagBoltConfig.numberTasks"></input></td>
                            </tr>
                            <tr>
                                <td>Event Bolt Config</td>
                                <td>{{selectedJob.sysConfigureProps.topo.eventBoltConfig.id}}</td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.eventBoltConfig.executors"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.eventBoltConfig.maxTaskParallelism"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.eventBoltConfig.numberTasks"></input></td>
                            </tr>
                            <tr>
                                <td>Error Bolt Config</td>
                                <td>{{selectedJob.sysConfigureProps.topo.errorBoltConfig.id}}</td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.errorBoltConfig.executors"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.errorBoltConfig.maxTaskParallelism"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.errorBoltConfig.numberTasks"></input></td>
                            </tr>
                            <tr>
                            <td>Dropped Bolt Config</td>
                                <td>{{selectedJob.sysConfigureProps.topo.droppedBoltConfig.id}}</td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.droppedBoltConfig.executors"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.droppedBoltConfig.maxTaskParallelism"></input></td>
                                <td><input ng-disabled="{{disabled}}" ng-model="selectedJob.sysConfigureProps.topo.droppedBoltConfig.numberTasks"></input></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        };
    })
    .directive('oscpStormSetinputInfo', ['strService', function (strService) {
        return {
            scope: {
                selectedJob: '=ngModel'
            },
            restrict: 'AE',
            controller: function ($scope) {
                $scope.addInputSource = function (inputsources) {
                    console.log('Add new input source');
                    $scope.add(inputsources);
                    // if(!!inputsources){
                    //     if(inputsources.length < $scope.datasourcecount){
                    //         scope.add(inputsources);
                    //     } else {
                    //         Notification.error($filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part1') + ' ' + $scope.datasourcecount + ' ' + $filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part2'));
                    //     }
                    // }
                };
                $scope.add = function (array) {
                    if (array !== undefined) {
                        array.push({
                            status: 1,
                            output: {},
                            userFields: []
                        });
                    }
                    console.log(array);
                };
                $scope.remove = function (array, $index) {
                    array.splice($index, 1);
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
            },
            template: `
        <div class="form-group">
            <div class="row">
                <div class="col-md-2">
                    <label>{{'ocsp_web_streams_manage_038' | translate}}*</label>
                </div>
                <div class="col-md-8">
                    <ui-select ng-model="selectedJob.input.dataSource" name="datasource" ng-required="true">
                        <ui-select-match>
                            <span ng-bind="$select.selected.name"></span>
                        </ui-select-match>
                        <ui-select-choices
                                repeat="datasource in ([selectedJob.input.dataSource] | filter: $select.search) track by datasource.id">
                            <span ng-bind="datasource.name"></span>
                        </ui-select-choices>
                    </ui-select>
                    <span class="redtip" ng-show="mainForm.datasource.$touched && mainForm.datasource.$error.required">{{'ocsp_web_common_027' | translate}}</span>
                </div>
            </div>
        </div>
        <button type="button" class="btn btn-primary" ng-click="addInputSource(selectedJob.input.inputs)">{{'ocsp_web_streams_manage_045' | translate}}</button>
        <uib-accordion>
            <div uib-accordion-group class="panel-default" ng-repeat="item in selectedJob.input.inputs" is-open="item.isOpen">
                <uib-accordion-heading>
                    <i class="pull-left glyphicon"
                    ng-class="{'glyphicon-chevron-down': item.isOpen, 'glyphicon-chevron-right': !item.isOpen}"></i>
                    &nbsp;
                    {{'ocsp_web_streams_manage_038' | translate}} {{item.name}}
                    <a class="pull-right" ng-click="$event.stopPropagation();$event.preventDefault();remove(selectedJob.input.inputs, $index)"><i
                            class="glyphicon glyphicon-remove"></i></a>
                </uib-accordion-heading>
                <div class="container-fluid">
                    <div class="form-group">
                        <label>{{'ocsp_web_streams_manage_010' | translate}}*</label>
                        <input type="text" class="form-control" ng-model="item.topic" name="inputTopic_{{$index}}" required>
                        <span class="redtip" ng-show="mainForm['inputTopic_' + $index].$touched && mainForm['inputTopic_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    </div>
                    <div class="form-group">
                        <label>{{'ocsp_web_common_011' | translate}}*</label>
                        <input type="text" class="form-control" ng-model="item.name" name="inputName_{{$index}}" required>
                        <span class="redtip" ng-show="mainForm['inputName_' + $index].$touched && mainForm['inputName_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    </div>
                    <div class="form-group">
                        <label>{{'ocsp_web_streams_manage_011' | translate}}*</label>
                        <tokenfield ng-model="item.fields" name="inputFields_{{$index}}" required="true"></tokenfield>
                        <span class="redtip" ng-show="mainForm['inputFields_' + $index].$touched && mainForm['inputFields_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    </div>
                    <div class="form-group">
                        <label>{{'ocsp_web_streams_manage_012' | translate}}*</label>
                        <input type="text" class="form-control" ng-model="item.delim" name="inputDelim_{{$index}}" required>
                        <span class="redtip" ng-show="mainForm['inputDelim_' + $index].$touched && mainForm['inputDelim_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    </div>
                </div>
            </div>
        </uib-accordion>
        <br>
        <div class="form-group">
            <div class="row">
                <div class="col-md-2">
                    <label>{{'ocsp_web_streams_manage_047' | translate}}*</label>
                </div>
                <div class="col-md-8">
                    <tokenfield ng-model="selectedJob.input.fields" name="inputFields" disabled="true" required="true"></tokenfield>
                    <span class="redtip" ng-show="mainForm.inputFields.$touched && mainForm.inputFields.$error.required">{{'ocsp_web_common_027' | translate}}</span>
                </div>
            </div>
        </div>
        <div class="form-group">
            <table class="table table-hover">
                <thead>
                <tr>
                    <th class="col-md-2">{{'ocsp_web_streams_case_field_name' | translate}}</th>
                    <th class="col-md-7">{{'ocsp_web_streams_case_expression' | translate}}</th>
                    <th class="col-md-1"><a ng-click="addUserField(selectedJob.input)"><i class="glyphicon glyphicon-plus"></i></a></th>
                </tr>
                </thead>
                <tbody>
                <tr ng-repeat="userfield in selectedJob.input.userFields">
                    <td class="col-md-2"><input type="text" class="form-control" ng-model="userfield.pname" required></td>
                    <td class="col-md-7"><input type="text" class="form-control" ng-model="userfield.pvalue" required></td>
                    <td class="col-md-1"><a ng-click="remove(selectedJob.input.userFields, $index)"><i class="glyphicon glyphicon-remove"></i></a></td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="form-group">
            <div class="row">
                <div class="col-md-2">
                    <label>{{'ocsp_web_streams_manage_013' | translate}}</label>
                </div>
                <div class="col-md-8">
                    <input type="text" class="form-control" ng-model="selectedJob.input.filter_expr"
                           popover-trigger="'mouseenter'"
                           popover-placement="right"
                           popover-append-to-body=true
                           uib-popover="{{'ocsp_web_common_property_filter' | translate}}"
                           popover-title="{{'ocsp_web_streams_manage_013' | translate}}">
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="row">
                <div class="col-md-2">
                    <label>{{'ocsp_web_streams_manage_014' | translate}}*</label>
                </div>
                <div class="col-md-8">
                    <input type="text" class="form-control" ng-model="selectedJob.input.uniqueKey" name="uniqueKey" required>
                    <span class="redtip" ng-show="mainForm.uniqueKey.$touched && mainForm.uniqueKey.$error.required">{{'ocsp_web_common_027' | translate}}</span>
                </div>
            </div>
        </div>
        <button type="button" class="btn btn-primary" ng-click="generate(selectedJob.input, selectedJob.input.inputs)">{{'ocsp_web_streams_manage_048' | translate}}</button>
            `
        };
    }])
    .directive('ocspStormEventsInfo', function () {
        return {
            scope: {
                selectedJob: '=ngModel'
            },
            restrict: 'AE',
            link: function (scope, elem, attrs) {
                scope.cep = attrs.cepenabled;
            },
            controller: function ($scope) {
                $scope.addInputSource = function (inputsources) {
                    console.log('Add new event');
                    $scope.add(inputsources);
                    // if(!!inputsources){
                    //     if(inputsources.length < $scope.datasourcecount){
                    //         scope.add(inputsources);
                    //     } else {
                    //         Notification.error($filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part1') + ' ' + $scope.datasourcecount + ' ' + $filter('translate')('ocsp_web_streams_manage_exceedmaxinputsourcecount_part2'));
                    //     }
                    // }
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
                $scope.remove = function (array, $index) {
                    array.splice($index, 1);
                };
            },
            template: `
            <button ng-if="!scope.cep" type="button" class="btn btn-primary" ng-click="addInputSource(selectedJob.events)">{{'ocsp_web_streams_manage_016' | translate}}</button>
            <uib-accordion>
              <div uib-accordion-group class="panel-default" ng-repeat="item in selectedJob.events" is-open="item.isOpen">
                <uib-accordion-heading>
                  <i class="pull-left glyphicon"
                     ng-class="{'glyphicon-chevron-down': item.isOpen, 'glyphicon-chevron-right': !item.isOpen}"></i>
                  &nbsp;
                  {{'ocsp_web_streams_manage_031' | translate}} {{item.name}}
                  <a ng-if="!scope.cep" class="pull-right" ng-click="$event.stopPropagation();$event.preventDefault();remove(selectedJob.events, $index)"><i
                  class="glyphicon glyphicon-remove"></i></a>
                </uib-accordion-heading>
                <div class="container-fluid">
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_037' | translate}}</label>
                  </div>
                  <div class="form-group">
                    <toggle-switch ng-model="item.status" ng-disabled="scope.cep">
                                   on-label="{{'ocsp_web_common_015' | translate}}"
                                   off-label="{{'ocsp_web_common_016' | translate}}"></toggle-switch>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_017' | translate}}*</label>
                    <input type="text" class="form-control" ng-model="item.name" name="eventsName_{{$index}}" required ng-disabled="scope.cep">
                    <span class="redtip" ng-show="mainForm['eventsName_' + $index].$touched && mainForm['eventsName_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_018' | translate}}*</label>
                    <tokenfield change="checkOutputFields(item.select_expr,selectedJob.input.fields,selectedJob.input.userFields)" inputs="{{getAllPossibleFields(selectedJob.input.fields,selectedJob.input.userFields)}}" labels="{{selectedJob.labels}}" ng-model="item.select_expr" name="eventsFields_{{$index}}" required="true" readonly="{{scope.cep}}"></tokenfield>
                    <span class="redtip" ng-show="mainForm['eventsFields_' + $index].$touched && mainForm['eventsFields_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    <span class="redtip" ng-show="outputFieldsInvalid">{{outputFieldsInvalidMessage}}</span>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_019' | translate}}*</label>
                    <input type="text" class="form-control" ng-model="item.delim" name="eventsDelim_{{$index}}" required ng-disabled="scope.cep">
                    <span class="redtip" ng-show="mainForm['eventsDelim_' + $index].$touched && mainForm['eventsDelim_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_013' | translate}}</label>
                    <input type="text" class="form-control" ng-model="item.filter_expr" ng-disabled="scope.cep">
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_020' | translate}}({{'ocsp_web_common_023' | translate}})*</label>
                    <input type="number" class="form-control" ng-model="item.interval" name="eventsInterval_{{$index}}" ng-pattern="/^(0|[1-9][0-9]*)$/" required ng-disabled="scope.cep">
                    <span class="redtip" ng-show="mainForm['eventsInterval_' + $index].$touched && mainForm['eventsInterval_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                    <span class="redtip" ng-show="mainForm['eventsInterval_' + $index].$touched && mainForm['eventsInterval_' + $index].$error.pattern">{{'ocsp_web_common_034' | translate}}</span>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_014' | translate}}*</label>
                    <input type="text" class="form-control" ng-model="item.output.uniqueKey" name="eventsUniqueKey_{{$index}}" required ng-disabled="scope.cep">
                    <span class="redtip" ng-show="mainForm['eventsUniqueKey_' + $index].$touched && mainForm['eventsUniqueKey_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_cep_auditperiod' | translate}}*</label>
                  </div>
                  <div class="form-group">
                    <toggle-switch on-label="{{'ocsp_web_common_040' | translate}}" off-label="{{'ocsp_web_common_041' | translate}}"  ng-model="item.audit.enableDateForSwitchButton" ng-change="switchAuditPeriod(item)">
                    </toggle-switch>
                  </div>
                  <div class="form-group" ng-if="item.audit.enableDateForSwitchButton === true">
                    <label>{{'ocsp_web_streams_manage_041' | translate}}</label>
                    <div class="row">
                      <div class="col-md-6">
                        <p class="input-group">
                          <input type="text" class="form-control" datetime-picker="yyyy-MM-dd" close-on-date-selection="false"
                                 datepicker-options="{showWeeks: false}" required ng-disabled="scope.cep"
                                 button-bar="false" ng-model="item.audit.startDate" is-open="item.audit.time.t1"
                                 datepicker-append-to-body="true">
                          <span class="input-group-btn">
                            <button type="button" class="btn btn-default" ng-disabled="scope.cep" ng-click="item.audit.time.t1 = true;"><i
                              class="glyphicon glyphicon-calendar"></i></button>
                          </span>
                        </p>
                      </div>
                      <div class="col-md-6">
                        <p class="input-group">
                          <input type="text" class="form-control" datetime-picker="yyyy-MM-dd" close-on-date-selection="false"
                                 datepicker-options="{showWeeks: false}" required ng-disabled="scope.cep"
                                 button-bar="false" ng-model="item.audit.endDate" is-open="item.audit.time.t2"
                                 datepicker-append-to-body="true">
                          <span class="input-group-btn">
                            <button type="button" class="btn btn-default" ng-disabled="scope.cep" ng-click="item.audit.time.t2 = true;"><i
                              class="glyphicon glyphicon-calendar"></i></button>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_040' | translate}}*</label>
                    <ui-select ng-model="item.audit.type" ng-required="true" ng-disabled="scope.cep"
                               name="eventsAudit_{{$index}}"
                               append-to-body="true"
                               on-select="onSelect(item)">
                      <ui-select-match>
                        <span ng-bind="$select.selected.displayName" ></span>
                      </ui-select-match>
                      <ui-select-choices
                        repeat="type.name as type in (item.auditTypes | filter: $select.search) track by type.name">
                        <span ng-bind="type.displayName"></span>
                      </ui-select-choices>
                    </ui-select>
                    <span class="redtip" ng-show="mainForm['eventsAudit_' + $index].$touched && mainForm['eventsAudit_' + $index].$error.required">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group" ng-if="item.audit.type && item.audit.type !== 'always'">
                    <label>{{'ocsp_web_streams_manage_041' | translate}}</label>
                    <div class="row" ng-repeat="period in item.audit.periods">
                      <div class="col-md-2">
                        <button type="button" class="btn btn-success btn-circle" ng-click="add(item.audit.periods)" ng-disabled="scope.cep">
                          <i class="glyphicon glyphicon-plus"></i></button>
                        <button type="button" class="btn btn-danger btn-circle" ng-disabled="scope.cep"
                                ng-click="remove(item.audit.periods, $index)"><i class="glyphicon glyphicon-remove"></i>
                        </button>
                      </div>
                      <div class="col-md-5">
                        <p class="input-group">
                          <input type="text" class="form-control" ng-model="period.s" required ng-pattern="/^[1-7]$/"
                                 uib-tooltip="{{'ocsp_web_streams_manage_042' | translate}} 1-7"
                                 tooltip-placement="top" ng-disabled="scope.cep"
                                 tooltip-trigger="'mouseenter'" ng-if="item.audit.type === 'week'">
                          <input type="text" class="form-control" ng-model="period.s" required
                                 uib-tooltip="{{'ocsp_web_streams_manage_042' | translate}} 1-31"
                                 ng-pattern="/^([1-9]|[1-2]\d|30|31)$/" ng-disabled="scope.cep"
                                 tooltip-placement="top"
                                 tooltip-trigger="'mouseenter'" ng-if="item.audit.type === 'month'">
                          <ocsp-time-picker ng-model="period.start"></ocsp-time-picker>
                        </p>
                      </div>
                      <div class="col-md-5">
                        <p class="input-group">
                          <input type="text" class="form-control" ng-model="period.d" required ng-pattern="/^[1-7]$/"
                                 uib-tooltip="{{'ocsp_web_streams_manage_042' | translate}} 1-7"
                                 tooltip-placement="top" ng-disabled="scope.cep"
                                 tooltip-trigger="'mouseenter'" ng-if="item.audit.type === 'week'">
                          <input type="text" class="form-control" ng-model="period.d" required
                                 uib-tooltip="{{'ocsp_web_streams_manage_042' | translate}} 1-31"
                                 ng-pattern="/^([1-9]|[1-2]\d|30|31)$/"
                                 tooltip-placement="top" ng-disabled="scope.cep"
                                 tooltip-trigger="'mouseenter'" ng-if="item.audit.type === 'month'">
                          <ocsp-time-picker ng-model="period.end"></ocsp-time-picker>
                        </p>
                      </div>
                    </div>
                  </div>
                  <!--For interface-->
                  <div class="form-group">
                    <label>{{'ocsp_web_streams_manage_021' | translate}}*</label>
                    <ui-select ng-model="item.output.datasource" ng-required="true" append-to-body="true" ng-disabled="scope.cep">
                      <ui-select-match>
                        <span ng-bind="$select.selected.name"></span>
                      </ui-select-match>
                      <ui-select-choices
                        repeat="datasource in (datasources | filter: $select.search) track by datasource.id">
                        <span ng-bind="datasource.name"></span>
                      </ui-select-choices>
                    </ui-select>
                    <span class="redtip" ng-if="item.output.datasource === undefined">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group" ng-if="item.output.datasource.type === 'kafka'">
                    <label>{{'ocsp_web_streams_manage_010' | translate}}*</label>
                    <input type="text" class="form-control" ng-model="item.output.topic" required ng-disabled="scope.cep">
                    <span class="redtip" ng-if="item.output.topic === undefined">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                  <div class="form-group" ng-if="item.output.datasource.type === 'codis'">
                    <label>{{'ocsp_web_streams_manage_022' | translate}}*</label>
                    <input type="text" class="form-control" ng-model="item.output.codisKeyPrefix" required ng-disabled="scope.cep">
                    <span class="redtip" ng-if="item.output.codisKeyPrefix === undefined">{{'ocsp_web_common_027' | translate}}</span>
                  </div>
                </div>
              </div>
            </uib-accordion>
            `
        };
    })
    .directive('ocspStreamRunStatusAndTime', function ($filter) {
        return {
            // scope: false,
            scope: {
                bindModel: '=ngModel'
            },
            restrict: 'AE',
            require: '^ngModel',
            replace: true,
            controller: function ($scope) {
                $scope.statusName = function (item) {
                    switch (item) {
                        case 0: return "glyphicon glyphicon-warning-sign danger"; //stop
                        case 1: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_start
                        case 2: return "glyphicon glyphicon-ok-sign success"; // running
                        case 3: return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                        case 4: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_restart
                        case 5: return "glyphicon glyphicon-refresh warning animated flash infinite"; // retry
                        case 'STOP': return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                        case 'STOPPED': return "glyphicon glyphicon-warning-sign danger"; // running
                        case 'START': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                        case 'STARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                        case 'RUNNING': return "glyphicon glyphicon-ok-sign success"; // running
                        case 'STOPPING': return "glyphicon glyphicon-warning-sign danger animated flash infinite";
                        case 'RESTARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite";
                        case 'RETRYING': return "glyphicon glyphicon-refresh warning animated flash infinite";
                    }
                };
                $scope.statusText = function (item) {
                    switch (item) {
                        case 0:
                        case 'STOPPED':
                            return $filter('translate')('ocsp_web_streams_manage_032');
                        case 1:
                        case 'START':
                        case 'STARTING':
                            return $filter('translate')('ocsp_web_streams_manage_033');
                        case 2:
                        case 'RUNNING':
                            return $filter('translate')('ocsp_web_streams_manage_034');
                        case 3:
                        case 'STOP':
                        case 'STOPPING':
                            return $filter('translate')('ocsp_web_streams_manage_035');
                        case 4:
                        case 'RESTARTING':
                            return $filter('translate')('ocsp_web_streams_manage_036');
                        case 5:
                        case 'RETRYING':
                            return $filter('translate')('ocsp_web_streams_manage_044');
                        default:
                            return item;
                    }
                };
            },
            template: `
            <div>
                <li class="list-group-item">
                    <h4>{{'ocsp_web_streams_manage_028' | translate}}:
                        <i ng-class="statusName(bindModel.status)"></i>&nbsp;{{statusText(bindModel.status)}}
                    </h4>
                </li>
                <li class="list-group-item">
                    <h4>{{'ocsp_web_streams_manage_029' | translate}}: {{bindModel.running_time | cusDate}}</h4>
                </li>
            </div>
            
            `
        };
    }).directive('ocspStreamRunStatus', function ($filter) {
        return {
            scope: {
                bindModel: '=ngModel',
            },
            restrict: 'AE',
            require: '^ngModel',
            replace: true,
            controller: function ($scope) {
                $scope.statusName = function (item) {
                    switch (item) {
                        case 0: return "glyphicon glyphicon-warning-sign danger"; //stop
                        case 1: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_start
                        case 2: return "glyphicon glyphicon-ok-sign success"; // running
                        case 3: return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                        case 4: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_restart
                        case 5: return "glyphicon glyphicon-refresh warning animated flash infinite"; // retry
                        case 'STOP': return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                        case 'STOPPED': return "glyphicon glyphicon-warning-sign danger"; // running
                        case 'START': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                        case 'STARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                        case 'RUNNING': return "glyphicon glyphicon-ok-sign success"; // running
                        case 'STOPPING': return "glyphicon glyphicon-warning-sign danger animated flash infinite";
                        case 'RESTARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite";
                        case 'RETRYING': return "glyphicon glyphicon-refresh warning animated flash infinite";
                    }
                };
                $scope.statusText = function (item) {
                    switch (item) {
                        case 0:
                        case 'STOPPED':
                            return $filter('translate')('ocsp_web_streams_manage_032');
                        case 1:
                        case 'START':
                        case 'STARTING':
                            return $filter('translate')('ocsp_web_streams_manage_033');
                        case 2:
                        case 'RUNNING':
                            return $filter('translate')('ocsp_web_streams_manage_034');
                        case 3:
                        case 'STOP':
                        case 'STOPPING':
                            return $filter('translate')('ocsp_web_streams_manage_035');
                        case 4:
                        case 'RESTARTING':
                            return $filter('translate')('ocsp_web_streams_manage_036');
                        case 5:
                        case 'RETRYING':
                            return $filter('translate')('ocsp_web_streams_manage_044');
                        default:
                            return item;
                    }
                };
            },
            template: `
          <font><i ng-class="statusName(bindModel.status)"></i>&nbsp;<b>{{statusText(bindModel.status)}}</b></font>
        `
        };
    })
    .directive('ocspSwitchBtn', function ($filter) {
        return {
            restrict: 'AE',
            scope: {
                saveFunc: '&saveFunc',
                cancelFunc: '&cancelFunc',
                editFunc: '&editFunc',
                disabled: '='
            },
            controller: function ($scope) {
                $scope.btnStatus = "edit";
                $scope.btnText = $filter('translate')('ocsp_web_common_042');
                $scope.btnCancel = $filter('translate')('ocsp_web_common_020');
                $scope.changeStatus = function () {
                    if ($scope.btnStatus === "edit") {
                        if ($scope.editFunc) {
                            $scope.editFunc();
                        }
                        $scope.btnStatus = "save";
                        $scope.btnText = $filter('translate')('ocsp_web_common_009');
                    } else {
                        if ($scope.saveFunc) {
                            if ($scope.saveFunc() !== false) {
                                $scope.btnStatus = "edit";
                                $scope.btnText = $filter('translate')('ocsp_web_common_042');
                            }
                        } else {
                            $scope.btnStatus = "edit";
                            $scope.btnText = $filter('translate')('ocsp_web_common_042');
                        }
                    }
                };
                $scope.cancel = function () {
                    $scope.btnStatus = "edit";
                    $scope.btnText =$filter('translate')('ocsp_web_common_042');
                    if ($scope.cancelFunc) {
                        $scope.cancelFunc();
                    }
                };
            },
            template:
                `
			<span>
                <button ng-disabled="disabled" class="oc-button" style="height:35px;width:50px;" ng-click="changeStatus()">{{btnText}}</button>
                &nbsp;
				<button ng-disabled="disabled" class="oc-button" style="height:35px;width:50px;" ng-show="btnStatus==='save'" ng-click="cancel()">{{btnCancel}}</button>
			</span>
			`
        };
    })
    .directive('ocspParamEditor', function () {
        return {
            restrict: 'AE',
            replace: false,
            require: '^ngModel',
            scope: {
                input: '=ngModel',
                disabled: '='
            },
            controller: function ($scope) {
                // $scope.addNewProperty = function (input) {
                //     let modal = $uibModal.open({
                //         animation: true,
                //         ariaLabelledBy: 'modal-title-bottom',
                //         ariaDescribedBy: 'modal-body-bottom',
                //         templateUrl: 'addNewPropertyPage.html',
                //         size: 'lg',
                //         backdrop: 'static',
                //         scope: $scope,
                //         controller: ['$scope', function ($scope) {
                //             $scope.newProperty = {
                //                 pname: '',
                //                 pvalue: ''
                //             };
                //             $scope.closeModal = function () {
                //                 modal.close();
                //             };
                //             $scope.saveNewProperty = function () {
                //                 if(!input.customParamsKV){
                //                     input.customParamsKV = [];
                //                 }
                //                 input.customParamsKV.push($scope.newProperty);
                //                 modal.close();
                //             };
                //         }]
                //     });
                // };
                $scope.removeCustomProperty = function(input,property){
                    if(input.customParamsKV){

                        input.customParamsKV.splice(input.customParamsKV.indexOf(property),1);
                        if(!input.customDeleteProps){
                            input.customDeleteProps = [];
                        }
                        input.customDeleteProps.push(property);
                    }
                    
                };
            },
            template:
                `
                <div>
                    <script type="text/ng-template" id="addNewPropertyPage.html">
                        <div class="modal-header">
                            <button type="button" class="close" ng-click="closeModal()"><span aria-hidden="true">&times;</span></button>
                            <h3 class="modal-title">{{ 'ocsp_web_common_customize_property' | translate }}</h3>
                        </div>
                        <div class="modal-body">
                            <div name="customPropertyMainFrame" ng-form id="customPropertyMainFrame">
                                <div class="form-group">
                                    <label>{{ 'ocsp_web_common_propertyname' | translate }}*</label>
                                    <input type="text" name="pname" class="form-control" ng-model="newProperty.pname" required>
                                    <span class="redtip" ng-messages="customPropertyMainFrame.pname.$error"
                                        ng-if="customPropertyMainFrame.pname.$touched">
                                                    <div ng-message="required">{{'ocsp_web_common_027' | translate}}</div>
                                                </span>
                                </div>
                                <div class="form-group">
                                    <label>{{ 'ocsp_web_common_propertyvalue' | translate }}*</label>
                                    <input type="text" name="pvalue" class="form-control" ng-model="newProperty.pvalue" required>
                                    <span class="redtip" ng-messages="customPropertyMainFrame.pvalue.$error"
                                        ng-if="customPropertyMainFrame.pvalue.$touched">
                                                    <div ng-message="required">{{'ocsp_web_common_027' | translate}}</div>
                                                </span>
                                </div>
                                <div class="form-group">
                                    <button type="button" class="btn oc-button" ng-disabled="customPropertyMainFrame.$invalid" ng-click="saveNewProperty()">{{'ocsp_web_common_009' |
                                        translate}}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </script>
                    <uib-accordion>
                        <div uib-accordion-group class="panel-default">
                            <uib-accordion-heading>
                            <i class="pull-left glyphicon" ng-class="{'glyphicon-chevron-down': item.isOpen, 'glyphicon-chevron-right': !item.isOpen}"></i> &nbsp;{{ 'ocsp_web_common_customize_property' | translate }}
                            </uib-accordion-heading>
                            <div class="container-fluid">
                                <div class="row" ng-repeat="item in input.customParamsKV">
                                    <div class="col-md-5">
                                        <span>{{item.pname}}</span>
                                    </div>
                                    <div class="col-md-6">
                                        <input ng-model="item.pvalue" class="form-control" ng-disabled="disabled">
                                    </div>
                                    <div class="col-md-1">
                                        <a ng-click="removeCustomProperty(input,item)" href="" ng-hide="disabled">
                                            <i class="glyphicon glyphicon-minus-sign danger"></i>
                                        </a>
                                    </div>
                                </div>
                                <a ng-hide="disabled" href="" ng-click="addNewProperty(input)">{{ 'ocsp_web_commom_add_customize_property' | translate }}...</a>
                            </div>
                        </div>
                    </uib-accordion>
                </div>
                `
        };
    });