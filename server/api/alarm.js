"use strict";
let express = require('express');
let router = express.Router();
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let ALARM = require('../model/STREAM_ALARM')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

// Note:

function updateWarningLevelInfo(rawRecords) {
  const levelMap = {
    "0": {
      "zh": "",
      "en": ""
    },
    "1": {
      "zh": "紧急",
      "en": "Critical"
    },
    "2": {
      "zh": "重要",
      "en": "Major"
    },
    "3": {
      "zh": "次要",
      "en": "Minor"
    },
    "4": {
      "zh": "提示",
      "en": "Warning"
    },
    "5": {
      "zh": "不确定",
      "en": "indeterminate"
    }
  };
  rawRecords.forEach((item) => {
    item.alarm_level = levelMap[item.alarm_level];
  });
}

function findRealTableNames(tableNames, rawTableName) {
  let realTableName = null;
  tableNames.forEach((tableName) => {
    if (tableName.toUpperCase() === rawTableName.toUpperCase()) {
      realTableName = tableName;
    }
  });
  return realTableName;
}

function updateComponentNameInfo(alarmsInfo, results, res, tableNames) {
  // If all alarmsInfo is handled, then response the results to user
  if (alarmsInfo.length === 0 || alarmsInfo[0] === undefined) {
    updateWarningLevelInfo(results);
    res.send(results);
  } else {
    let realTableName = findRealTableNames(tableNames, 'STREAM_' + alarmsInfo[0].alarm_component_name);
    let component_id = alarmsInfo[0].component_id;
    if (realTableName && component_id !== -1) {
      const qeuryToFindNameOfTargetTable = "select name from " + realTableName + " where id=" + component_id;
      sequelize.query(qeuryToFindNameOfTargetTable, { type: sequelize.QueryTypes.SELECT })
        .then(nameDataFromTargetTable => {
          alarmsInfo[0].componentNameFromTargetTable = alarmsInfo[0].alarm_component_name + ' : ' + nameDataFromTargetTable[0].name;
          results.push(alarmsInfo.shift());
          updateComponentNameInfo(alarmsInfo, results, res, tableNames);
        }).catch(function (err) {
          console.error(err);
          res.status(500).send(trans.databaseError);
        });
    } else {
      alarmsInfo[0].componentNameFromTargetTable = component_id === -1 ? "" : "Could Not Found!";
      results.push(alarmsInfo.shift());
      updateComponentNameInfo(alarmsInfo, results, res, tableNames);
    }
  }
}

router.get('/', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let whereCondition = "";
  if (usertype !== 'admin') {
    whereCondition = `where STREAM_TASK.owner="${username}"`;
  }

  let findAllTables = 'show tables';
  sequelize.query(findAllTables, { type: sequelize.QueryTypes.SELECT })
    .then(allTables => {
      let allTableNames = [];
      for (var index in allTables) {
        for (var key in allTables[index]) {
          allTableNames.push(allTables[index][key]);
        }
      }

      let queryStringToFindAllAlarmsNeedsShow = `
      select * from 
      (select STREAM_ALARM.id as stream_alarm_id,STREAM_ALARM.alarm_id,alarm_type,alarm_time,alarm_content,task_id,component_id,alarm_level,alarm_ChName,alarm_EnName,alarm_component_name from STREAM_ALARM left join STREAM_ALARM_DEFINITION on STREAM_ALARM.alarm_id = STREAM_ALARM_DEFINITION.alarm_id where id in (select max(id) from STREAM_ALARM group by task_id,alarm_id,component_id) and alarm_type='0') alarmsinfo 
      join STREAM_TASK on  alarmsinfo.task_id = STREAM_TASK.id ${whereCondition}
      `;
      sequelize.query(queryStringToFindAllAlarmsNeedsShow, { type: sequelize.QueryTypes.SELECT })
        .then(allAlarmsNeedsShow => {
          let results = [];
          updateComponentNameInfo(allAlarmsNeedsShow, results, res, allTableNames);
        }).catch(function (err) {
          console.error(err);
          res.status(500).send(trans.databaseError);
        });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
});

// Note: Find all alarms belown to task {:id}
// Now the task(id)'s latest alarm's status is 0,
// we need find all alarms to show from now to the past, until we found a alarm with status 1, or show all alarms

router.get('/:id', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let whereCondition = "";
  if (usertype !== 'admin') {
    whereCondition = `where owner="${username}"`;
  }
  let alarmId = req.params.id;
  let findAllTables = 'show tables';
  sequelize.query(findAllTables, { type: sequelize.QueryTypes.SELECT })
    .then(allTables => {
      let allTableNames = [];
      for (var index in allTables) {
        for (var key in allTables[index]) {
          allTableNames.push(allTables[index][key]);
        }
      }

      ALARM.find({ where: { id: alarmId } })
        .then(targetAlarmRecord => {
          if (targetAlarmRecord) {
            let alarm_id = targetAlarmRecord.alarm_id;
            let task_id = targetAlarmRecord.task_id;
            let component_id = targetAlarmRecord.component_id;
            let alarm_type = targetAlarmRecord.alarm_type;
            const sqlQueryToFindRelatedAlarms = `
            SELECT *
            FROM (
              SELECT STREAM_ALARM.id, STREAM_ALARM.alarm_id, STREAM_ALARM.alarm_type, STREAM_ALARM.alarm_time,
              STREAM_ALARM.alarm_content, STREAM_ALARM.task_id, STREAM_ALARM.component_id,
              STREAM_ALARM_DEFINITION.alarm_level, STREAM_ALARM_DEFINITION.alarm_ChName,
              STREAM_ALARM_DEFINITION.alarm_EnName, STREAM_ALARM_DEFINITION.alarm_component_name
              FROM STREAM_ALARM
              LEFT JOIN STREAM_ALARM_DEFINITION ON STREAM_ALARM.alarm_id = STREAM_ALARM_DEFINITION.alarm_id
              WHERE STREAM_ALARM.alarm_id = ${alarm_id}
              AND STREAM_ALARM.task_id = ${task_id}
              AND STREAM_ALARM.component_id = ${component_id}
              AND STREAM_ALARM.id <= ${alarmId}
            ) alarmsinfo
            JOIN (select id as task_id, name as task_name from STREAM_TASK ${whereCondition}) STREAM_TASK ON alarmsinfo.task_id = STREAM_TASK.task_id ORDER BY alarmsinfo.id DESC;
            `;
            sequelize.query(sqlQueryToFindRelatedAlarms, { type: sequelize.QueryTypes.SELECT })
              .then(rawAlarmsInfo => {
                let allAlarmsNeedsShow = [rawAlarmsInfo[0]];
                // If current alarm_type is "0", then this api should return all rawAlarmsInfo records until we hit oneRecords with alarm_type "1"
                if (alarm_type === "0") {
                  for (let i = 1; i < rawAlarmsInfo.length; i++) {
                    if (rawAlarmsInfo[i].alarm_type === '1') {
                      break;
                    } else {
                      allAlarmsNeedsShow.push(rawAlarmsInfo[i]);
                    }
                  }
                } else {
                  // If the alarm_type is 1, then we should first go through the records and find one record with alarm_type 0, and then
                  // continue go through the records until we find another record with alarm_type 1, then we found all the alarms need show
                  // If we can't find a record with alarm_type 0, then all the records should be considered as valid record for current call
                  let zeroRecordExist = false;
                  let maxPosIndex = -1;
                  for (let i = 1; i < rawAlarmsInfo.length; i++) {
                    if (rawAlarmsInfo[i].alarm_type === '0') {
                      zeroRecordExist = true;
                    }
                    if (rawAlarmsInfo[i].alarm_type === '1' && zeroRecordExist) {
                      maxPosIndex = i - 1;
                    }
                  }
                  // In this case, allAlarmsNeedsShow contains all data in rawAlarmsInfo
                  if (maxPosIndex === -1) {
                    allAlarmsNeedsShow = rawAlarmsInfo;
                  } else {
                    for (let i = 1; i < maxPosIndex; i++) {
                      allAlarmsNeedsShow.push(rawAlarmsInfo[i]);
                    }
                  }
                }
                let results = [];
                updateComponentNameInfo(allAlarmsNeedsShow, results, res, allTableNames);
              }).catch(function (err) {
                console.error(err);
                res.status(500).send(trans.databaseError);
              });
          } else {
            res.send([]);
          }
        })
        .catch(function (err) {
          console.error(err);
          console.log('Send 500 V2');
          res.status(500).send(trans.databaseError);
        });

    })
    .catch(function (err) {
      console.error(err);
      console.log('Send 500 V2');
      res.status(500).send(trans.databaseError);
    });


});

function sortBy(data, sortKey, isAsc) {
  for (var i = 0; i < data.length; i++) {
    for (var j = i + 1; j < data.length; j++) {
      if ((data[i][sortKey] > data[j][sortKey] && isAsc) || (data[i][sortKey] < data[j][sortKey] && !isAsc)) {
        var tmp = data[j];
        data[j] = data[i];
        data[i] = tmp;
      }
    }
  }
}

router.get('/history/all', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let whereCondition = "";
  if (usertype !== 'admin') {
    whereCondition = `where owner="${username}"`;
  }
  let findAllTables = 'show tables';
  sequelize.query(findAllTables, { type: sequelize.QueryTypes.SELECT })
    .then(allTables => {
      let allTableNames = [];
      for (var index in allTables) {
        for (var key in allTables[index]) {
          allTableNames.push(allTables[index][key]);
        }
      }

      let queryToFindAll = `
        SELECT *
        FROM (
          SELECT STREAM_ALARM.id AS stream_alarm_id, STREAM_ALARM.alarm_id, alarm_type, alarm_time, alarm_content, task_id,
            component_id, alarm_level, alarm_ChName, alarm_EnName, alarm_component_name
            FROM STREAM_ALARM
            LEFT JOIN STREAM_ALARM_DEFINITION ON STREAM_ALARM.alarm_id = STREAM_ALARM_DEFINITION.alarm_id
            WHERE id IN (
              SELECT max(id)
              FROM STREAM_ALARM
              GROUP BY task_id , alarm_id , component_id)
        ) alarmsinfo
        JOIN STREAM_TASK ON alarmsinfo.task_id = STREAM_TASK.id ${whereCondition}
        `;
      sequelize.query(queryToFindAll, { type: sequelize.QueryTypes.SELECT })
        .then(allAlarmsNeedsShow => {
          let results = [];
          sortBy(allAlarmsNeedsShow, 'id', false);
          updateComponentNameInfo(allAlarmsNeedsShow, results, res, allTableNames);
        }).catch(function (err) {
          console.error(err);
          res.status(500).send(trans.databaseError);
        });

    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
});

router.get('/definition/all', function (req, res) {
  sequelize.query("SELECT * FROM STREAM_ALARM_DEFINITION", { type: sequelize.QueryTypes.SELECT })
    .then(allAlarmDefinition => {
      updateWarningLevelInfo(allAlarmDefinition);
      res.status(200).send(allAlarmDefinition);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
});

module.exports = router;
