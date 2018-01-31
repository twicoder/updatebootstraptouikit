'use strict';
/**
 * Wizard directive
 */
angular.module('ocspApp').directive('tokenfield', ['strService', '$filter', function (strService, $filter) {
  return {
    restrict: 'E',
    templateUrl: 'views/directive/tokenfield.html',
    transclude: true,
    replace: true,
    scope: {
      ngModel: '=',
      checkinputfield: '@'
    },
    controller: function ($scope) {
      const resetItemValidateInfo = function (value, msg) {
        $scope.outputFieldsInvalid = value;
        $scope.outputFieldsInvalidMessage = msg;
      };
      $scope.trimStr = function (str) {
        return str.replace(/(^\s*)|(\s*$)/g, '');
      };
      $scope.inputChanged = function () {
        if (!!$scope.checkinputfield && $scope.checkinputfield === 'true') {
          let invalidOuptuFields = [];
          if (!!$scope.ngModel) {
            let outputFields = $scope.ngModel.split(',');
            outputFields.forEach((item)=>{
              if (!$scope.allLegalInputs.has($scope.trimStr(item))) {
                invalidOuptuFields.push(item);
              }
            });
            if (invalidOuptuFields.length !== 0) {
              resetItemValidateInfo(true, invalidOuptuFields.join(',') + $filter('translate')('ocsp_web_common_035'));
            } else {
              resetItemValidateInfo(false, "");
            }
          } else {
            resetItemValidateInfo(false, "");
          }
        }
      };
    },
    link: function (scope, element, attrs) {
      scope.checkinputfield = attrs.checkinputfield;
      scope.allLegalInputs = [];
      
      let _findLabelTips = function () {
        let [inputs, labels] = [attrs.inputs, attrs.labels];
        let result = new Set();
        if (inputs !== undefined && inputs.trim() !== "") {
          result = new Set(strService.split(inputs));
        }
        if (labels !== undefined && labels.trim() !== "") {
          labels = JSON.parse(labels);
          for (let i in labels) {
            if (labels[i].properties) {
              let items = [];
              try{
                items = JSON.parse(labels[i].properties);
              }catch(err){
                console.log(err);
              }
              if (items && items.labelItems && items.labelItems.length > 0) {
                for (let j in items.labelItems) {
                  if (!result.has(items.labelItems[j].pvalue)) {
                    result.add(items.labelItems[j].pvalue);
                  }
                }
              }
            }
          }
        }
        scope.allLegalInputs = result;
        // call inputChanged function to reflect the changes
        scope.inputChanged();
        return [...result];
      };
      
      scope.bRequired = attrs !== undefined && attrs.required === 'true';
      let _bDisabled = attrs !== undefined && attrs.disabled === 'true';
      let $e = element.find('input');
      let token = {};
      // Add tips
      token = $e.tokenfield({
        autocomplete: {
          source: _findLabelTips(),
          delay: 100
        },
        sortable: true,
      });
      attrs.$observe('inputs', () => {
        $e.data('bs.tokenfield').$input.autocomplete({ source: _findLabelTips() });
      });
      attrs.$observe('labels', () => {
        $e.data('bs.tokenfield').$input.autocomplete({ source: _findLabelTips() });
      });
      //Disable duplicated keys
      $e.on('tokenfield:createtoken', function (event) {
        let existingTokens = $(this).tokenfield('getTokens');
        $.each(existingTokens, function (index, token) {
          if (token.value === event.attrs.value) {
            event.preventDefault();
          }
        });
      });
      scope.$watch('ngModel', function () {
        token.tokenfield('setTokens', scope.ngModel);
      });
      

      attrs.$observe('readonly', function (val) {
        if(val==="true"){
          token.tokenfield('disable');
        } else {
          token.tokenfield('enable');
        }
        if (_bDisabled) {
          element.find("input.token-input").attr('disabled', true);
        } else {
          element.find("input.token-input").attr('disabled', false);
        }
      });
      

      token.on('tokenfield:sorttoken', function () {
        scope.$apply(function () {
          let fields = token.tokenfield('getTokens');
          let results = "";
          if (fields.length > 0) {
            results = fields[0].value;
          }
          for (let i = 1; i < fields.length; i++) {
            if (fields[i].value !== undefined && fields[i].value.trim() !== "") {
              results += "," + fields[i].value;
            }
          }
          scope.ngModel = results;
        });
      });
    }
  };
}]);

