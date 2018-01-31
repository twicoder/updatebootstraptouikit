"use strict";
let express = require('express');
let config = require('../config');
let trans = config[config.trans || 'zh'];
let router = express.Router();
let fs = require('fs');
let propReader = require('properties-parser');
let auditFileName = '../conf/ocsp-audit-log4j.properties';
let auditProperties = propReader.read(auditFileName);
let log4jsCofigs = {
    type:auditProperties.logtype || 'dateFile',
    filename:auditProperties.dirpath || '../logs',
    pattern:auditProperties.pattern || 'ocsp-audit-yyyy-MM-dd.log',
    alwaysIncludePattern:auditProperties.alwaysIncludePattern || true,
    maxLogSize:auditProperties.maxLogSize || 1024,
    backups:auditProperties.backups || 4,
    category:auditProperties.category || 'logInfo'
};

let baseLogDirPath = log4jsCofigs.filename;

function getLogFileDate(logFileName){
    return logFileName.substring(11,21);
}

router.get('/', function (req, res) {
  let usertype = req.query.usertype;
  if (usertype !== "admin") {
    res.send([]);
  } else {
    fs.readdir(baseLogDirPath, (err,files) => {
        let resultFiles = [];
        files.forEach( (oneFileName) => {
            if(oneFileName.match(/^ocsp-audit*/g)){
                resultFiles.push({
                    oneFileName:oneFileName,
                    logFileDate:getLogFileDate(oneFileName)
                });
            }
        });
        let reverseFilesRecords = [];
        for(let i=resultFiles.length-1;i>=0;i--){
            reverseFilesRecords.push(resultFiles[i]);
        }
        res.send(reverseFilesRecords);
    });
  }
});

function formatOneLineRecord(oneLineLog){
    let userActionStr = oneLineLog.substring(43);
    let userActionParts = userActionStr.split('|');
    let userName = userActionParts[0];
    let userType = userActionParts[1];
    let ipAddress = userActionParts[2];
    let userActionMethod = userActionParts[3];
    let userActionMethodCnName = userActionMethod;
    let userActionMethodEnName = userActionMethod;
    if(userActionMethod==='POST'){
        userActionMethodCnName='创建';
        userActionMethodEnName='Create';
    }else if(userActionMethod==='PUT'){
        userActionMethodCnName='更新';
        userActionMethodEnName='Update';
    }
    let userActionUrl = userActionParts[4];
    let userActionData = {};
    let userActionDataIndex = oneLineLog.indexOf('{',25);
    if(userActionDataIndex > 0){
        userActionData = oneLineLog.substring(userActionDataIndex);
    }
    if(userActionUrl && userActionUrl.substring(0,15) === '/api/user/login'){
        userActionData = JSON.parse(userActionData);
        userName = userActionData.username;
        // should not record user's password
        userActionData.password = 'XXXXXXXXXXXX';
        userActionData = JSON.stringify(userActionData);
    }

    let result = {
        recordDate: oneLineLog.substring(1, 20).replace('T',' ').replace(/-/g, '/'),
        userName: userName,
        userType: userType,
        ipAddress: ipAddress,
        method: userActionMethod,
        userActionMethodCnName: userActionMethodCnName,
        userActionMethodEnName: userActionMethodEnName,
        url: userActionUrl,
        data: userActionData
    };
    return result;
}

function getFormatedLogs(linesOfLogs){
    let finalResultLines = [];
    for(var oneLineContent in linesOfLogs) {
        let oneLineFormatedData = formatOneLineRecord(linesOfLogs[oneLineContent]);
        if(oneLineFormatedData.recordDate.length !==0 ){
            finalResultLines.push(oneLineFormatedData);
        }
    }
    return finalResultLines.reverse();
}


router.get('/:logFileName', function (req, res) {
    let usertype = req.query.usertype;
    if (usertype !== "admin") {
      res.send([]);
    } else {
        fs.readFile(baseLogDirPath + req.params.logFileName, 'utf8', (err, data) => {
            if (err){
                res.status(500).send(trans.databaseError);
            }
            let lines = data.split("\n");
            res.send(getFormatedLogs(lines));
        });
    }
  });

module.exports = router;