'use strict';
/**
 * OCSP Directive
 */
angular.module('ocspApp')
  .directive('ocspInputShowTime', function () {
    return {
      scope: {
        bindModel: '=ngModel'
      },
      restrict: 'A',
      require: '^ngModel',
      link: function link($scope, elem, attrs, ngModelCtrl) {
        var get2CharValue = function get2CharValue(orgValue) {
          if (String(orgValue).length === 1) {
            return "0" + String(orgValue);
          } else {
            return String(orgValue);
          }
        };
        ngModelCtrl.$render = function () {
          if ($scope.bindModel === undefined || $scope.bindModel === null || !($scope.bindModel instanceof Date)) {
            $scope.bindModel = new Date();
          }
          var outputVal = "" + get2CharValue($scope.bindModel.getHours()) + ":" + get2CharValue($scope.bindModel.getMinutes()) + ":" + get2CharValue($scope.bindModel.getSeconds());
          elem.val(outputVal);
        };
      }
    };
  })
  .directive('ocspTimePicker', function () {
    return {
      scope: {
        bindModel: '=ngModel',
        change: '&'
      },
      restrict: 'AE',
      require: '^ngModel',
      replace: true,
      controller: function ($scope) {
        $scope.changed = function () {
          $scope.change();
        };
      },
      template: "<div><div class=\"btn-group\" uib-dropdown><p class=\"input-group\"><input id=\"split-button\" ocsp-input-show-time=\"\" type=\"text\" class=\"form-control\" ng-model=\"bindModel\" onfocus=this.blur() required><span class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" uib-dropdown-toggle><i class=\"glyphicon glyphicon-time\"></i></button></span></p><ul class=\"dropdown-menu\" uib-dropdown-menu role=\"menu\" aria-labelledby=\"split-button\" ng-click=\"$event.preventDefault(); $event.stopPropagation();updateTime()\"><div uib-timepicker show-seconds=\"true\" show-meridian=\"false\" ng-change=\"changed()\" ng-model=\"bindModel\"></div></ul></div></div>"
    };
  })
  .directive('ocspDatetimePicker', function () {
    return {
      scope: {
        bindModel: '=ngModel',
        change: '&'
      },
      restrict: 'AE',
      require: '^ngModel',
      replace: true,
      controller: function ($scope) {
        $scope.changed = function () {
          $scope.change();
        };
      },
      template: `
      <div>
      <div class="btn-group">
          <div uib-dropdown>
              <p class="input-group">
                  <input type="text" class="form-control" ng-change="changed()" uib-datepicker-popup ng-model="bindModel" is-open="bindModel.t1"
                         show-button-bar='false' ng-required="true"/>
                  <span class="input-group-btn">
                    <button type="button" class="btn btn-default" ng-click="bindModel.t1 = true;"><i
                            class="glyphicon glyphicon-calendar"></i></button>
                </span>
                  <input id="split-button-time" ocsp-input-show-time="" type="text" class="form-control" ng-model="bindModel"
                         onfocus=this.blur() required>
                  <span class="input-group-btn">
                        <button type="button" class="btn btn-default" uib-dropdown-toggle>
                            <i class="glyphicon glyphicon-time"></i>
                        </button>
                    </span>
              <ul class="dropdown-menu pull-right" uib-dropdown-menu role="menu" aria-labelledby="split-button"
                  ng-click="$event.preventDefault(); $event.stopPropagation();updateTime()">
                  <div uib-timepicker show-seconds="true" show-meridian="false" ng-change="changed()"
                       ng-model="bindModel"></div>
              </ul>
          </div>
          </p>
      </div>
  </div>
    `
    };
  });
