'use strict';
/**
 * String utils
 */
angular.module('ocspApp')
  .service('strService',[function(){
    this.split = function(str){
      let result = [];
      if(str !== undefined && str.length > 0){
        let tmp = str.split(",");
        for(let i in tmp){
          result.push(tmp[i].trim());
        }
      }
      return result;
    };
  }]);
