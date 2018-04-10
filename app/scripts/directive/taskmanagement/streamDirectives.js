'use strict';
/**
 * Confirmation Block Directive
 */
angular.module('ocspApp')
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
    })
    .directive('ocspStreamRunStatus', function ($filter) {
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
                    $scope.btnText = $filter('translate')('ocsp_web_common_042');
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
    .directive('ocspParamEditor', function ($uibModal) {
        return {
            restrict: 'AE',
            replace: false,
            require: '^ngModel',
            scope: {
                input: '=ngModel',
                disabled: '='
            },
            controller: function ($scope) {
                $scope.addNewProperty = function (input) {
                    let modal = $uibModal.open({
                        animation: true,
                        ariaLabelledBy: 'modal-title-bottom',
                        ariaDescribedBy: 'modal-body-bottom',
                        templateUrl: 'addNewPropertyPage.html',
                        size: 'lg',
                        backdrop: 'static',
                        scope: $scope,
                        controller: ['$scope', function ($scope) {
                            $scope.newProperty = {
                                pname: '',
                                pvalue: ''
                            };
                            $scope.closeModal = function () {
                                modal.close();
                            };
                            $scope.saveNewProperty = function () {
                                if(!input.customParamsKV){
                                    input.customParamsKV = [];
                                }
                                input.customParamsKV.push($scope.newProperty);
                                modal.close();
                            };
                        }]
                    });
                };
                $scope.removeCustomProperty = function (input, property) {
                    if (input.customParamsKV) {

                        input.customParamsKV.splice(input.customParamsKV.indexOf(property), 1);
                        if (!input.customDeleteProps) {
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
                    <div class="uk-panel uk-panel-box">
                        <h3 class="uk-panel-header">
                            <i class="pull-left fas" ng-class="{'fa-chevron-down': item.isOpen, 'fa-chevron-right': !item.isOpen}"></i> &nbsp;{{ 'ocsp_web_common_customize_property' | translate }}
                        </h3>
                        <div class="uk-panel-body">
                            <div class="uk-grid" ng-repeat="item in input.customParamsKV">
                                <div class="uk-width-4-10">
                                    <span>{{item.pname}}</span>
                                </div>
                                <div class="uk-width-5-10">
                                    <input ng-model="item.pvalue" class="form-control" ng-disabled="disabled">
                                </div>
                                <div class="uk-width-1-10">
                                    <a ng-click="removeCustomProperty(input,item)" href="" ng-hide="disabled">
                                        <i class="fas fa-minus danger"></i>
                                    </a>
                                </div>
                            </div>
                            <a ng-hide="disabled" href="" ng-click="addNewProperty(input)">{{ 'ocsp_web_commom_add_customize_property' | translate }}...</a>
                        </div>
                    </div>
                </div>
                `
        };
    });