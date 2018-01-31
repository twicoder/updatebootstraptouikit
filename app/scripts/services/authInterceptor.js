'use strict';
angular.module('ocspApp').factory('AuthInterceptor', ['$q', '$rootScope', '$filter', '$cookies', ($q, $rootScope, $filter, $cookies)=> {
  return {
    'request': function(config) {
      function htmlRequest(url){
        return !!(url.endsWith(".html") || url.endsWith(".htm"));
      }
      let url = config.url;
      if(!htmlRequest(url) && config.method !== 'GET') {
        if ($rootScope.isAdmin()) {
          if (url.startsWith("/api/task") && !url.startsWith("/api/tasksjobs/withdatainterfaceproperties/all")) {
            return $q.reject({data: $filter('translate')('ocsp_web_user_manage_008')});
          }
        } else {
          if (url.startsWith("/api/prop") || url.startsWith("/api/datasource")) {
            return $q.reject({data: $filter('translate')('ocsp_web_user_manage_008')});
          }
        }
      }
      if(!htmlRequest(url)) {
        //If not status update, cookies can update expires time.
        if(!url.startsWith("/api/task/status") && !url.startsWith("/api/chart/taskData/")) {
          config.url += `?username=${$rootScope.getUsername()}&usertype=${$rootScope.isAdmin() ? "admin" : "user"}&token=${$rootScope.getToken()}`;
        }else{
          config.url += `?username=${$cookies.get("username")}&usertype=${$rootScope.isAdmin() ? "admin" : "user"}&token=${$cookies.get("token")}`;
        }
      }
      return config;
    }
  };
}]);
