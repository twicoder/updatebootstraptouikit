'use strict';
/**
 * Confirmation Block Directive
 */
angular.module('ocspApp').directive('confirmation',['$filter','$ngConfirm', function($filter, $ngConfirm){
  return {
    scope: {
      action: "&"
    },
    link: function (scope, element, attrs) {
      element.bind('click', function () {
        if (attrs.disabled === "false") {
          $ngConfirm({
            title: $filter('translate')('ocsp_web_common_038'),
            content: $filter('translate')('ocsp_web_common_039'),
            buttons: {
              ok: {
                text: $filter('translate')("ocsp_web_common_021"),
                action: function () {
                  scope.action();
                }
              },
              cancel: {
                text: $filter('translate')("ocsp_web_common_020"),
              }
            }
          });
        }
      });
    }
  };
}]);
