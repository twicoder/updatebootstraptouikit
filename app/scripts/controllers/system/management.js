'use strict';

/**
 * For label management main page controller
 */
angular.module('ocspApp')
  .controller('SystemManagementCtrl', ['$scope', '$http', 'Notification', '$q', '$rootScope', '$filter', '$uibModal', '$ngConfirm', function ($scope, $http, Notification, $q, $rootScope, $filter, $uibModal, $ngConfirm) {
    $rootScope.init('system');

    $scope.kerberosConfigureExist = false;
    $scope.isKerberosEnabled = false;

    $scope.isAdminUser = function () {
      return $rootScope.isAdmin() === true;
    };

    $scope.tab = "sparksystemconfig";
    $scope.changeTab = function (name) {
      $scope.tab = name;
    };

    $scope.propertyMap = new Map();
    $scope.otherCategoryName = "other";
    function init() {
      $q.all({ allprop: $http.get('/api/prop/all'), datasource: $http.get('/api/datasource') }).then(function (arr) {
        $scope.prop = arr.allprop.data.prop;
        $scope.categorySet = arr.allprop.data.categorySet;
        $scope.categorySet.push($scope.otherCategoryName);

        if ($scope.categorySet) {
          $scope.categorySet.forEach((item) => {
            $scope.propertyMap.set(item, []);
          });
        }
        if ($scope.prop) {
          $scope.prop.forEach((item) => {
            if (item.status === 1) {
              if (item.STREAM_SYSTEMPROP_CATEGORY) {
                $scope.propertyMap.get(item.STREAM_SYSTEMPROP_CATEGORY.name).push(item);
              } else {
                $scope.propertyMap.get($scope.otherCategoryName).push(item);
              }
            }

            if (item.name === 'ocsp.cache.database.type') {
              $scope.cacheDatabaseType = item.value;
            }

          });
        }

        for (var index in $scope.prop) {
          if ($scope.prop[index].name === 'ocsp.kerberos.enable') {
            $scope.isKerberosEnabled = $scope.prop[index].value;
            $scope.kerberosConfigureExist = true;
          }
        }
        $scope.datasource = arr.datasource.data;
        if ($scope.datasource !== undefined && $scope.datasource.length > 0) {
          for (let i in $scope.datasource) {
            $scope.datasource[i].props = JSON.parse($scope.datasource[i].properties);
          }
        }
      });
    }

    init();

    $scope.remove = function ($index) {
      $scope.datasource.splice($index, 1);
    };

    $scope.getItemType = function(name){
      let matchItems = [
        "password",
        "passwd"
      ];
      let result = "text";
      matchItems.forEach((nameToCheck) => {
        if(name && name.toLowerCase().indexOf(nameToCheck) >= 0){
          result = "password";
        }
      });

      return result;
    };

    $scope.trans = function (str) {
      return str.replace(/\./g, '_');
    };

    $scope.isPropertyNameContainsEnable = function (name) {
      let targetString = '.enable';
      let formatedName = name.replace(/\s+/g, '');
      if (formatedName.substring(formatedName.length - targetString.length) === targetString) {
        return true;
      } else {
        return false;
      }
    };

    $scope.openSparkModal = function () {
      let modal = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title-bottom',
        ariaDescribedBy: 'modal-body-bottom',
        templateUrl: 'stackedModal.html',
        size: 'lg',
        backdrop: 'static',
        scope: $scope,
        controller: ['$scope', 'Notification', function ($scope, Notification) {
          $scope.closeModal = function () {
            modal.close();
          };
          $scope.saveDatasource = function () {
            if ($("#mainFrame .ng-invalid").length === 0) {
              $ngConfirm({
                title: $filter('translate')('ocsp_web_common_038'),
                content: $filter('translate')('ocsp_web_common_039'),
                scope: $scope,
                buttons: {
                  ok: {
                    text: $filter('translate')("ocsp_web_common_021"),
                    action: function () {
                      $http.post("/api/datasource", { data: $scope.newDatasource }).success(function () {
                        modal.close();
                        $scope.newDatasource = {};
                        Notification.success($filter('translate')('ocsp_web_common_026'));
                        init();
                      });
                    }
                  },
                  cancel: {
                    text: $filter('translate')("ocsp_web_common_020"),
                  }
                }
              });
            }
          };
          $scope.isFormValid = function(){
            return $("#mainFrame .ng-invalid").length === 0;
          };
        }]
      });
    };

    $scope.openPropertyDefineModal = function () {
      let modal = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title-bottom',
        ariaDescribedBy: 'modal-body-bottom',
        templateUrl: 'addSystemPropertyModal.html',
        size: 'lg',
        backdrop: 'static',
        scope: $scope,
        controller: ['$scope', 'Notification', function ($scope, Notification) {
          $scope.newSystemProp = {
            "name": "",
            "value": "",
            "status": 1,
            "description": ""
          };
          $scope.closeModal = function () {
            modal.close();
          };
          $scope.saveNewSystemProp = function () {
            if ($("#idNewSystemProp .ng-invalid").length === 0) {
              $ngConfirm({
                title: $filter('translate')('ocsp_web_common_038'),
                content: $filter('translate')('ocsp_web_common_039'),
                scope: $scope,
                buttons: {
                  ok: {
                    text: $filter('translate')("ocsp_web_common_021"),
                    action: function () {
                      $http.post("/api/prop/", { newproperty: $scope.newSystemProp }).success(function () {
                        modal.close();
                        $scope.newSystemProp = {
                          "name": "",
                          "value": "",
                          "status": 1,
                          "description": ""
                        };
                        Notification.success($filter('translate')('ocsp_web_common_026'));
                        init();
                      });
                    }
                  },
                  cancel: {
                    text: $filter('translate')("ocsp_web_common_020"),
                  }
                }
              });
            }
          };
        }]
      });
    };

    $scope.removeUserDefinedProperty = function (property) {
      $ngConfirm({
        title: $filter('translate')('ocsp_web_common_038'),
        content: $filter('translate')('ocsp_web_common_039'),
        scope: $scope,
        buttons: {
          ok: {
            text: $filter('translate')("ocsp_web_common_021"),
            action: function () {
              $http.delete("/api/prop/" + property.id).success(function () {
                Notification.success($filter('translate')('ocsp_web_common_026'));
                init();
              });
            }
          },
          cancel: {
            text: $filter('translate')("ocsp_web_common_020"),
          }
        }
      });
    };

    $scope.updateCurrentPageProperties = function (properties) {
      properties.forEach((item) => {
        if (item.name === 'ocsp.cache.database.type') {
          $scope.cacheDatabaseType = item.value;
        }
      });
    };

    $scope.notEmpty = function (props) {
      let numberOfItems = 0;
      props.forEach((item) => {
        if (item.name !== 'ocsp.cache.database.type') {
          numberOfItems++;
        }
      });
      return numberOfItems > 0;
    };

    function updateRootScopeProp(props){
      if(props){
        props.forEach((item) => {
          if(item.name === 'ocsp.kerberos.enable'){
            $rootScope.shouldShowKerberosConfigure = item.value;
          }
        });
      }
    }

    $scope.save = function () {
      $scope.updateCurrentPageProperties($scope.prop);
      for (let i in $scope.datasource) {
        $scope.datasource[i].properties = JSON.stringify($scope.datasource[i].props);
      }
      $q.all({
        prop: $http.put("/api/prop", { data: $scope.prop }),
        datasource: $http.put("/api/datasource", { data: $scope.datasource })
      })
        .then(function () {
          updateRootScopeProp($scope.prop);
          Notification.success($filter('translate')('ocsp_web_common_026'));
        });
    };

    $scope.isNotSpecialProperties = function (property) {
      let specialPropertyes = [
        'ocsp.kerberos.enable',
        'ocsp.kerberos.keyTab',
        'ocsp.kerberos.principal',
        'ocsp.cache.database.type',
        'ocsp.event.cep.enable',
        'ocsp.kerberos.keyTab',
        'ocsp.kerberos.principal',
        'spark.submit.deployMode'
      ];
      let checkResult = true;
      specialPropertyes.forEach((item) => {
        if (item === property.name) {
          checkResult = false;
        }
      });
      if(property){
        let propertyParts = property.name.split('.');
        if(propertyParts.length>0 && propertyParts[propertyParts.length-1].toLowerCase() === 'enable'){
          checkResult = false;
        }
      }
      
      return checkResult;
    };

    $scope.switchKerberosEnableStatus = function (isKerberosEnabled) {
      if (isKerberosEnabled === true) {
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'kerberosConfigureWarning.html',
          size: 'lg',
          backdrop: 'static',
          scope: $scope,
          controller: ['$scope', function ($scope) {
            $scope.searchItem = {};
            $scope.closeModal = function () {
              var scopeOfIsKerberosEnabled = angular.element("#isIsKerberosEnabled").scope();
              scopeOfIsKerberosEnabled.isKerberosEnabled = !scopeOfIsKerberosEnabled.isKerberosEnabled;
              modal.close();
            };
            $scope.continueConfigKerberos = function () {
              $scope.$parent.isKerberosEnabled = true;
              modal.close();
            };
          }]
        });
      } else {
        $scope.isKerberosEnabled = false;
      }
    };

  }]);
