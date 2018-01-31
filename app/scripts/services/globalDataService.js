'use strict';
/**
 * String utils
 */
angular.module('ocspApp')
    .service('globalDataService', ['$filter', '$http', '$interval', function ($filter, $http, $interval) {
        this.localLang = {
            search: $filter('translate')('ocsp_web_common_014'),
            nothingSelected: $filter('translate')('ocsp_web_common_017')
        };

        this.auditTypes = [
            { name: 'always', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_always') },
            { name: 'day', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_day') },
            { name: 'week', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_week') },
            { name: 'month', displayName: $filter('translate')('ocsp_web_streams_subscribe_type_month') }
        ];
        this.auditTimes = [
            { name: 'none', displayName: '无' },
            { name: 'have', displayName: '有' }
        ];

        let urlSourceMapping = {
            '/api/config/links': {
                'key': 'LINK',
                'value': '无法获取LINK数据'
            },
            '/api/task/status': {
                'key': 'Task Status',
                'value': '无法获取Task状态数据'
            },
            '/api/job/status': {
                'key': 'Job Status',
                'value': '无法获取Job状态数据'
            }
        };

        this.getAPromiseForFetchData = function (url) {
            let that = this;
            return new Promise(function (resolve, reject) {
                $http.get(url).success(function (data) {
                    if (urlSourceMapping[url]) {
                        that.withdrawWarningMessage(urlSourceMapping[url].key);
                    }
                    resolve(data);
                }).catch(function (err) {
                    if (urlSourceMapping[url]) {
                        that.publishGlobalWarningMessage(urlSourceMapping[url].key, urlSourceMapping[url].value);
                    }
                    reject(err);
                });
            });
        };

        this.getLinks = function () { return this.getAPromiseForFetchData('/api/config/links'); };
        this.getDataSourceCount = function () { return this.getAPromiseForFetchData('/api/prop/datasourcecount'); };
        this.getSparkProperty = function () { return this.getAPromiseForFetchData('/api/prop/spark'); };
        this.getTasksStatus = function () { return this.getAPromiseForFetchData('/api/task/status'); };
        this.getJobsStatus = function () { return this.getAPromiseForFetchData('/api/job/status'); };
        this.getTaskStatusByID = function (id) { return this.getAPromiseForFetchData('/api/task/status/' + id); };
        this.getJobStatusByID = function (id) { return this.getAPromiseForFetchData('/api/job/status/' + id); };
        this.getProps = function () { return this.getAPromiseForFetchData('/api/prop'); };
        this.getCepEnableStatus = function () { return this.getAPromiseForFetchData('/api/config/cepEnable'); };
        this.getStormEnableStatus = function () { return this.getAPromiseForFetchData('/api/config/stormenabled'); };

        this.isKerberosConfigureCorrect = function (userInfo) {
            if (!userInfo.spark_keytab || !userInfo.spark_principal || !userInfo.kafka_keytab || !userInfo.kafka_principal) {
                return false;
            }
            if (userInfo.spark_keytab === "" || userInfo.spark_principal === "" || userInfo.kafka_keytab === "" || userInfo.kafka_principal === "") {
                return false;
            }
            return true;
        };

        this.streamActions = [
            { name: $filter('translate')('ocsp_web_streams_manage_024'), enable: true, icon: "glyphicon glyphicon-play success" },
            { name: $filter('translate')('ocsp_web_streams_manage_025'), enable: true, icon: "glyphicon glyphicon-stop danger" },
            { name: $filter('translate')('ocsp_web_streams_manage_026'), enable: true, icon: "glyphicon glyphicon-refresh danger" },
            { name: $filter('translate')('ocsp_web_streams_manage_027'), enable: true, icon: "glyphicon glyphicon-remove-sign warning" }
        ];

        this.statusName = function (item) {
            switch (item) {
                case 0: return "glyphicon glyphicon-warning-sign danger"; //stop
                case 1: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_start
                case 2: return "glyphicon glyphicon-ok-sign success"; // running
                case 3: return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                case 4: return "glyphicon glyphicon-ok-sign success animated flash infinite"; // pre_restart
                case 5: return "glyphicon glyphicon-refresh warning animated flash infinite"; // retry
                case 'STOP': return "glyphicon glyphicon-warning-sign danger animated flash infinite"; // pre_stop
                case 'STOPPED': return "glyphicon glyphicon-warning-sign danger"; // running
                case 'START': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                case 'STARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite"; // running
                case 'RUNNING': return "glyphicon glyphicon-ok-sign success"; // running
                case 'STOPPING': return "glyphicon glyphicon-warning-sign danger animated flash infinite";
                case 'RESTARTING': return "glyphicon glyphicon-ok-sign success animated flash infinite";
                case 'RETRYING': return "glyphicon glyphicon-refresh warning animated flash infinite";
            }
        };

        this.rawWarningMessages = new Map();
        this.totalWarningMessages = null;
        this.formatTotalWarningMessages = function () {
            this.totalWarningMessages = '';
            for (var oneKey of this.rawWarningMessages.keys()) {
                this.totalWarningMessages += `${oneKey}:${this.rawWarningMessages.get(oneKey)}\t`;
            }
            if (this.totalWarningMessages === '') {
                this.totalWarningMessages = null;
            }
        };

        // 将告警信息及其信息源发送至全局告警信息栏
        this.publishGlobalWarningMessage = function (source, msg) {
            this.rawWarningMessages.set(source, msg);
            this.formatTotalWarningMessages();
        };
        // 撤销全局告警信息
        this.withdrawWarningMessage = function (source) {
            this.rawWarningMessages.delete(source);
            this.formatTotalWarningMessages();
        };

        this.intervalServices = [];
        this.registIntervalService = function (serviceObj) {
            this.intervalServices.push(serviceObj);
        };
        this.clearIntervalServices = function () {
            this.intervalServices.forEach((item) => {
                $interval.cancel(item);
            });
        };

    }]);
