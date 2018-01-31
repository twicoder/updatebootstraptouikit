"use strict";

import log4js from 'log4js';
import propReader from 'properties-parser';

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

log4js.configure({
    appenders: {
        logInfo: log4jsCofigs
    },
    categories: {
        default: { appenders: ['logInfo'], level: 'info' }
    }
});

function getIPAddress(req){
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
}

function getFormattedMsg(ipAddress,url,actionType,queryString,actionData){
    let userName = '<UserName not known>';
    let userType = '<UserType not known>';
    let seperator = '|';
    if(queryString){
        userName = queryString.username;
        userType = queryString.usertype;
    }
    let columns = [];
    columns.push(userName);
    columns.push(userType);
    columns.push(ipAddress);
    columns.push(actionType);
    columns.push(url);
    columns.push(actionData);
    let result = columns.join(seperator);
    return result;
}

module.exports = (req, res, next) => {
    // let urlsDontNeedRecord = [];
    // urlsDontNeedRecord.push('/api/task/status');
    // urlsDontNeedRecord.push('/api/job/status');
    let logger = log4js.getLogger('logInfo');
    let ipAddress = getIPAddress(req);
    // Only record POST mothod now
    if(req.method==="POST" || req.method==="PUT"){
        if(req.url && req.url.substring(0,15) === '/api/user/login'){
            // should not record user's password
            let loginBody = {
                username:req.body.username,
                password:'XXXXXXXX'
            };
            logger.info(getFormattedMsg(ipAddress,req.url,req.method,req.query,JSON.stringify(loginBody)));
        } else {
            logger.info(getFormattedMsg(ipAddress,req.url,req.method,req.query,JSON.stringify(req.body)));
        }
        
    }
    next();
};