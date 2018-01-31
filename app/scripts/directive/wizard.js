'use strict';
/**
 * Wizard directive
 */
angular.module('ocspApp').directive('wizard',['$filter', '$rootScope', function($filter, $rootScope){
  return {
    restrict: 'E',
    templateUrl: 'views/directive/wizard.html',
    transclude: true,
    replace: true,
    scope:{
      submitMethod: "&",
      task: "="
    },
    link : function(scope, element, attrs) {
      let options = {
        contentWidth : attrs.width,
        contentHeight : 600,
        backdrop: 'static',
        buttons: {
          cancelText: $filter('translate')('ocsp_web_common_020'),
          nextText: $filter('translate')('ocsp_web_common_007'),
          backText: $filter('translate')('ocsp_web_common_008'),
          submitText: $filter('translate')('ocsp_web_common_021'),
          submittingText: $filter('translate')('ocsp_web_common_022')
        }
      };
      let wizardel = element.find(".wizard");
      wizardel.attr("data-title",attrs.title);
      wizardel.find("div.wizard-card").each(function(){
        let cardname = $(this).attr("data-cardname");
        $(this).prepend("<h3 style='display: none'>" + $filter('translate')(cardname) + "</h3>");
      });
      element.find("button.wizard-button").text($filter('translate')(attrs.name));
      if($rootScope.isAdmin()){
        element.find("button.wizard-button").attr("disabled", true);
      }
      let wizardModal = wizardel.wizard(options);
      scope.showModal = function(){
        wizardModal.show();
      };
      scope.$on('openModal',function(){
        wizardModal.show();
      });
      wizardModal.on("closed", function(){
        wizardModal.reset();
      });
      wizardModal.on("validate", function(wizard){
        let flag = true;
        wizard.el.find("span.redtip:not(#idWarningMessageOfTokenField)").remove();
        wizard.el.find("#idWarningMessageOfTokenField").each(function(){
          if($(this)[0].innerText!==""){
            flag = false;
          }
        });
        wizard.el.find("input.ng-invalid:not(.tokenfield)").each(function(){
          $(this).addClass("ng-touched");
          $(this).after(`
            <span class="redtip">${$filter('translate')('ocsp_web_common_035')}</span>
          `);
          flag = false;
        });
        wizard.el.find("div.ng-invalid").each(function(){
          $(this).addClass("ng-touched");
          $(this).after(`
            <span class="redtip">${$filter('translate')('ocsp_web_common_035')}</span>
          `);
          flag = false;
        });
        return flag;
      });
      wizardModal.on("submit", function() {
        let promise = scope.submitMethod();
        promise.then(function () {
          wizardModal.submitSuccess();
          wizardModal.reset();
          wizardModal.close();
        }, function () {
          wizardModal.submitFailure();
          wizardModal.reset();
        });
      });
    }
  };
}]);
