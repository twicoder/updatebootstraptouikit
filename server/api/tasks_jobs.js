"use strict";

import express from "express";
import sequelize from "../sequelize";
import Sequelize from "sequelize";
import config from "../config";
// import request from 'request';
import _ from 'lodash';

// let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Task = require('../model/STREAM_TASK')(sequelize, Sequelize);
let Job = require('../model/STREAM_JOB')(sequelize, Sequelize);
let DataInterface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let trans = config[config.trans || 'zh'];
let router = express.Router();


//获取所有流任务信息
router.get('/', function (req, res) {
    let username = req.query.username;
    let usertype = req.query.usertype;
    let searchOptionByUser = {};
    if (usertype !== "admin") {
        searchOptionByUser = { owner: username };
    }
    Task.findAll({ where: searchOptionByUser }).then((tasks) => {
        tasks.forEach(item => item.dataValues.enginetype = 'SPARK');
        if (config.storm_engine_supported) {
            Job.findAll({ where: searchOptionByUser }).then((jobs) => {
                jobs.forEach(item => item.dataValues.enginetype = 'STORM');
                let allTasksAndJobs = _.concat(tasks, jobs);
                res.send(allTasksAndJobs);
            });
        } else {
            res.send(tasks);
        }
    }).catch(function (err) {
        console.error(err);
        res.status(500).send(trans.databaseError);
    });
});

//获取所有流任务信息
router.get('/withdatainterfaceproperties/all', function (req, res) {
    let username = req.query.username;
    let usertype = req.query.usertype;
    let searchOptionByUser = "";
    if (usertype !== "admin") {
        searchOptionByUser = ` where owner="${username}" `;
    }
    let sqlToFindAllTasksWithProperties = `
    SELECT STREAM_TASK.id AS id, STREAM_TASK.name AS name, diid, STREAM_DATAINTERFACE.properties as properties
    FROM STREAM_TASK
    JOIN STREAM_DATAINTERFACE ON STREAM_TASK.diid = STREAM_DATAINTERFACE.id ${searchOptionByUser}
    `;
    let sqlToFindAllJobsWithProperties = `
    SELECT STREAM_JOB.id AS id, STREAM_JOB.name AS name, diid_fk as diid, STREAM_DATAINTERFACE.properties as properties
    FROM STREAM_JOB
    JOIN STREAM_DATAINTERFACE ON STREAM_JOB.diid_fk = STREAM_DATAINTERFACE.id ${searchOptionByUser}
    `;
    sequelize.query(sqlToFindAllTasksWithProperties, { type: sequelize.QueryTypes.SELECT })
        .then(allTasksWithProperties => {
            if (config.storm_engine_supported) {
                sequelize.query(sqlToFindAllJobsWithProperties, { type: sequelize.QueryTypes.SELECT })
                    .then(allJobsWithProperties => {
                        let allTasksAndJobsWithProperties = _.concat(allTasksWithProperties, allJobsWithProperties);
                        res.status(200).send(allTasksAndJobsWithProperties);
                    })
                    .catch(function (err) {
                        console.error(err);
                        res.status(500).send(trans.databaseError);
                    });
            } else {
                res.status(200).send(allTasksWithProperties);
            }
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send(trans.databaseError);
        });
});


function mergeProperties(targetProps, sourceProps) {
    sourceProps.forEach((sourceItem) => {
        let foundSourceItemNameInTarget = false;
        targetProps.forEach((targetItem) => {
            if (targetItem.pname === sourceItem.name) {
                foundSourceItemNameInTarget = true;
                targetItem.pvalue = sourceItem.value;
            }
        });
        if (!foundSourceItemNameInTarget) {
            targetProps.push({
                "pname": sourceItem.name,
                "pvalue": sourceItem.value
            });
        }
    });
}

function updateAllStreamRecordsOneByOne(tasksNeedUpdate, res) {
    if (!tasksNeedUpdate || tasksNeedUpdate.length === 0) {
        res.status(200).send({});
    } else {
        let recordNeedUpdate = tasksNeedUpdate.shift();
        if (recordNeedUpdate.isAlarmConfigured) { // this record need bo be updated
            mergeProperties(recordNeedUpdate.parsedProperties.props, recordNeedUpdate.newAlarmConfigs);
            DataInterface.update(
                { "properties": JSON.stringify(recordNeedUpdate.parsedProperties) },
                { where: { id: recordNeedUpdate.diid } }
            ).then(function () {
                updateAllStreamRecordsOneByOne(tasksNeedUpdate, res);
            }).catch(function (err) {
                console.error(err);
                res.status(500).send(trans.databaseError);
            });
        } else {
            updateAllStreamRecordsOneByOne(tasksNeedUpdate, res);
        }
    }
}

router.post('/withdatainterfaceproperties/all', function (req, res) {
    updateAllStreamRecordsOneByOne(req.body.data, res);
});

//获取特定流任务信息
router.get('/:id', function (req, res) {
    let username = req.query.username;
    let usertype = req.query.usertype;
    let searchOptionByUser = { id: req.params.id };
    if (usertype !== "admin") {
        searchOptionByUser = {
            owner: username,
            id: req.params.id
        };
    }
    Task.findOne({ where: searchOptionByUser }).then((oneTask) => {
        if (oneTask) {
            oneTask.dataValues.enginetype = 'SPARK';
            res.send(oneTask);
        } else if (config.storm_engine_supported) {
            Job.findOne({ where: searchOptionByUser }).then((oneJob) => {
                if (oneJob) {
                    oneJob.dataValues.enginetype = 'STORM';
                    res.send(oneJob);
                } else {
                    res.send({});
                }
            }).catch(function (err) {
                console.error(err);
                res.status(500).send(trans.databaseError);
            });
        } else {
            res.send({});
        }
    }).catch(function (err) {
        console.error(err);
        res.status(500).send(trans.databaseError);
    });
});

module.exports = router;
