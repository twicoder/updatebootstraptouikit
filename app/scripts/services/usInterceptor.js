'use strict';
angular.module('ocspApp').factory('UsInterceptor', ['$q', 'usSpinnerService', '$injector', ($q, usSpinnerService, $injector)=>{
  function htmlRequest(url){
    return !!(url.endsWith(".html") || url.endsWith(".htm"));
  }
  function isRequestAlreadyCovered(url){
    var coveredUrls = [
      '/api/prop/isalarmenabled',
      '/api/config/cepEnable',
      '/api/prop'
    ];
    var urlExists = false;
    for(var index in coveredUrls){
      if(url.startsWith(coveredUrls[index])){
        urlExists = true;
      }
    }
    return urlExists;
  }
  return {
    'request': (config) => {
      let url = config.url;
      if(!htmlRequest(url) && !url.startsWith("/api/task/status") && !url.startsWith("/api/job/status") && !url.startsWith("/api/chart/taskData/") && !url.startsWith("/api/chart/stormData/") && !url.startsWith("/api/alarm/")) {
        usSpinnerService.spin('spinner');
      }
      return config;
    },
    'response': (response) => {
      let url = response.config.url;
      if(!htmlRequest(url) && !url.startsWith("/api/task/status") && !url.startsWith("/api/job/status") && !url.startsWith("/api/chart/taskData/") && !url.startsWith("/api/chart/stormData/") && !url.startsWith("/api/alarm/")) {
        usSpinnerService.stop('spinner');
      }
      return response;
    },
    'responseError': (reason) => {
      if (reason) {
        let url = reason.config.url;
        //Use $injector to load service dynamically in case of circle dependencies
        if (!htmlRequest(url) && !url.startsWith("/api/task/status") && !url.startsWith("/api/job/status") && !url.startsWith("/api/chart/taskData/") && !url.startsWith("/api/chart/stormData/") && !url.startsWith("/api/alarm/")) {
          usSpinnerService.stop('spinner');
        }
        let Notification = $injector.get('Notification');
        if (reason.data && reason.data !== "" && !isRequestAlreadyCovered(url)) {
          Notification.error(reason.data);
        }
      }
      return $q.reject(reason);
    },
  };
}]);
