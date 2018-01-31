'use strict';
/**
 * Date filter
 */
angular.module('ocspApp').filter('cusDate',['$filter', function($filter) {
  return function(input){
    input = parseInt(input);
    if(isNaN(input)){
      return "";
    }
    if(input < 0){
      return "";
    }
    input = Math.floor(input / 1000);
    let h = Math.floor(input / 3600);
    input = input % 3600;
    let m = Math.floor(input / 60);
    if(h === 0){
      return m + $filter('translate')('ocsp_web_common_006');
    }else {
      return h + $filter('translate')('ocsp_web_common_005') + m + $filter('translate')('ocsp_web_common_006');
    }
  };
}]);

