'use strict';

/**
 * For label management main page controller
 */
angular.module('ocspApp')
  .controller('LabelManagementCtrl', ['$scope', '$http', 'Upload', 'Notification', '$timeout', '$rootScope', '$filter', '$uibModal', 'NgTableParams',
    function ($scope, $http, Upload, Notification, $timeout, $rootScope, $filter, $uibModal, NgTableParams) {
      $rootScope.init('label');

      $scope.canEditLabels = false;

      $scope.tab = 'propitems';

      $scope.username = $rootScope.username;
      $scope.isAdminUser = $rootScope.isAdmin();

      $scope.tryEditLabels = function () {
        $scope.canEditLabels = true;
      };

      $scope.cancelEditLabels = function () {
        $scope.canEditLabels = false;
      };

      function init() {
        $scope.message = null;
        $scope.page = {
          perpage: 5,
          maxsize: 10,
          curpage: 1,
          labels: [],
        };
        $http.get('/api/label').success(function (data) {
          $scope.labels = data;
          $scope.page.totalitems = data.length;
          $scope.page.labels = $scope.labels.slice(0, $scope.page.perpage);
        });
      }

      init();


      $scope.editLabelProperties = function (label) {
        let modal = $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title-bottom',
          ariaDescribedBy: 'modal-body-bottom',
          templateUrl: 'labelPropertiesEditor.html',
          size: 'lg',
          backdrop: 'static',
          scope: $scope,
          controller: ['$scope', function ($scope) {
            $scope.labelName = label.name;
            if (!label.properties || label.properties.replace(/\s*/g, '') === '') {
              label.formatedProperties = JSON.stringify({
                "props": [],
                "labelItems": []
              });
            } else {
              label.formatedProperties = label.properties;
            }
            $scope.jsonProperties = JSON.parse(label.formatedProperties);
            $scope.jsonProperties.props.forEach((item) => { item.isEditing = false; });
            $scope.jsonProperties.labelItems.forEach((item) => { item.isEditing = false; });

            $scope.listProperties = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.props });
            $scope.listLabelItems = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.labelItems });

            $scope.closeModal = function () {
              modal.close();
            };

            $scope.deleteProperty = function (propertyToDelete) {
              if ($scope.tab === 'propitems') {
                $scope.jsonProperties.props.splice($scope.jsonProperties.props.indexOf(propertyToDelete), 1);
                $scope.listProperties = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.props });
              } else {
                $scope.jsonProperties.labelItems.splice($scope.jsonProperties.labelItems.indexOf(propertyToDelete), 1);
                $scope.listLabelItems = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.labelItems });
              }

            };
            $scope.cancelEdit = function (propertyItem) {
              propertyItem.isEditing = false;
            };
            $scope.saveProperty = function (propertyItem) {
              propertyItem.isEditing = false;
            };
            $scope.addNewJSONProperty = function () {
              if ($scope.tab === 'propitems') {
                $scope.jsonProperties.props.unshift({
                  pname: '',
                  pvalue: '',
                  isEditing: true
                });
                $scope.listProperties = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.props });
              } else {
                $scope.jsonProperties.labelItems.unshift({
                  pname: '',
                  pvalue: '',
                  isEditing: true
                });
                $scope.listLabelItems = new NgTableParams({ 'count': '5' }, { counts: [], paginationMinBlocks: 4, paginationMaxBlocks: 7, dataset: $scope.jsonProperties.labelItems });
              }

            };

            $scope.saveNewLabelProperties = function () {
              let finalJsonProps = [];
              let finalLabelItems = [];
              $scope.jsonProperties.props.forEach((oneProperty) => {
                if (oneProperty.pname.replace(/\s*/g, '') !== '') {
                  finalJsonProps.push({
                    pname: oneProperty.pname,
                    pvalue: oneProperty.pvalue
                  });
                }
              });
              $scope.jsonProperties.labelItems.forEach((oneProperty) => {
                if (oneProperty.pname.replace(/\s*/g, '') !== '') {
                  finalLabelItems.push({
                    pname: oneProperty.pname,
                    pvalue: oneProperty.pvalue
                  });
                }
              });
              $scope.jsonProperties.props = finalJsonProps;
              $scope.jsonProperties.labelItems = finalLabelItems;
              label.properties = JSON.stringify($scope.jsonProperties);
              $scope.save();
              modal.close();
            };

          }]
        });


      };

      $scope.upload = function () {
        if ($scope.file !== undefined && $scope.file !== "") {
          $scope.uploadFile($scope.file);
        }
      };

      $scope.save = function () {
        $http.post("/api/label", { labels: $scope.labels })
          .success(function () {
            Notification.success($filter('translate')('ocsp_web_common_026'));
          })
          .error(function(err){
            console.log(err);
          });
      };

      $scope.uploadFile = function (file) {
        Upload.upload({
          url: '/api/label/upload',
          data: { file: file, username: 'jar' }
        }).then(function () {
          $timeout(function () {
            init();
            Notification.success($filter('translate')('ocsp_web_common_028'));
          }, 1000);
        }, function (err) {
          $scope.message = err.data;
        });
      };

      $scope.choose = (page) => {
        $scope.page.labels = $scope.labels.slice((page - 1) * $scope.page.perpage, page * $scope.page.perpage);
        $scope.page.curpage = page;
      };

      $scope.owner = (label) => {
        return label.owner !== $rootScope.getUsername();

      };

    }]);
