"use strict";

import express from "express";
import sequelize from "../sequelize";
import Sequelize from "sequelize";
import config from "../config";

let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Task = require('../model/STREAM_TASK')(sequelize, Sequelize);
let Event_Model = require('../model/STREAM_EVENT')(sequelize, Sequelize);
let Label = require('../model/STREAM_LABEL_DEFINITION')(sequelize, Sequelize);
let LabelRefer = require('../model/STREAM_LABEL')(sequelize, Sequelize);
let trans = config[config.trans || 'zh'];
let router = express.Router();

function QueryLabelFields(i, LabelReferData, label_promises, res) {
  label_promises.push(Label.find({
    attributes: ['properties'],
    where: {
      id: LabelReferData[i].dataValues.label_id
    }
  }, () => {
    res.status(500).send(trans.databaseError);
  }));
}


function QueryAllStreamInfoRecur(AllStreamData, AllStreamResult, res) {
  if(AllStreamData.length === 0){
    res.status(200).send(AllStreamResult);
    return;
  } else {
    let currStreamRecordToHandle = AllStreamData.shift();
    let StreamData = currStreamRecordToHandle.dataValues;
    let all_fields = [];
    let all_eventids = [];
    let diid = currStreamRecordToHandle.diid;
    let LabelReferData;
    let promises = [];
    let label_promises = [];
    promises.push(Interface.find({
      attributes: ['properties'],
      where: {
        id: diid
      }
    }).then((InterfaceData) => {
      let properties = JSON.parse(InterfaceData.dataValues.properties);
      let properties_fields = properties.fields;
      for (let i in properties_fields) {
        all_fields.push(properties_fields[i].pname);
      }
    }));
    promises.push(Event_Model.findAll({
      attributes: [['id', 'eventid']],
      where: {
        diid: diid
      }
    }).then((EventData) => {
      for (let i in EventData) {
        all_eventids.push(EventData[i].dataValues.eventid);
      }
    }));
    promises.push(LabelRefer.findAll({
      attributes: ['label_id'],
      where: {
        diid: diid
      }
    }).then((Data) => {
      LabelReferData = Data;
    }, () => {
      res.status(500).send(trans.databaseError);
    }));
    sequelize.Promise.all(promises).then(() => {
      for (let i in LabelReferData) {
        QueryLabelFields(i, LabelReferData, label_promises, res);
      }
      sequelize.Promise.all(label_promises).then((LabelData) => {
        for (let i in LabelData) {
          let LabelItems = JSON.parse(LabelData[i].dataValues.properties).labelItems;
          for (let j in LabelItems) {
            all_fields.push(LabelItems[j].pvalue);
          }
        }
        StreamData.all_eventids = all_eventids;
        StreamData.all_fields = all_fields;
        AllStreamResult.streams.push(StreamData);
        QueryAllStreamInfoRecur(AllStreamData, AllStreamResult, res);

      }, () => {
        res.status(500).send(trans.databaseError);
      });
    });
  }
}

//获取所有流任务信息
router.get('/', function (req, res) {
  let page_size = parseInt(req.query.page_size);
  let page = parseInt(req.query.page);
  if (isNaN(page_size)) {
    page_size = 15;
  }
  if (isNaN(page)) {
    page = 1;
  }
  let limit = page_size;
  let offset = (page - 1) * page_size;
  Task.findAll({
    attributes: [['id', 'streamid'], 'name', 'type', 'receive_interval', 'queue', 'status', 'start_time', 'stop_time', 'description', 'diid'],
    limit: limit,
    offset: offset
  }).then((AllStreamData) => {
    let AllStreamResult = {"pageSize": "", "totalPageNumber": "", "currentPage": "", "streams": []};
    AllStreamResult.pageSize = page_size;
    AllStreamResult.currentPage = page;
    AllStreamResult.totalPageNumber = Math.ceil(AllStreamData.length / page_size);
    // if (AllStreamData.length !== 0) {
    //   for (let i in AllStreamData) {
    //     QueryAllStreamInfo(i, AllStreamData, AllStreamResult, res);
    //   }
    // }
    // else {
    //   res.status(500).send(trans.databaseError);
    // }
    QueryAllStreamInfoRecur(AllStreamData,AllStreamResult,res);
  }, () => {
    res.status(500).send(trans.databaseError);
  });
});

//根据流任务id获取流任务信息
router.get('/:id', function (req, res) {
  Task.find({
    attributes: [['id', 'streamid'], 'name', 'type', 'receive_interval', 'queue', 'status', 'start_time', 'stop_time', 'description', 'diid'],
    where: {
      id: req.params.id
    }
  }).then((TaskData) => {
    let StreamData = TaskData.dataValues;
    let all_fields = [];
    let all_eventids = [];
    let diid = TaskData.dataValues.diid;
    let LabelReferData;
    let promises = [];
    let label_promises = [];
    promises.push(Interface.find({
      attributes: ['properties'],
      where: {
        id: diid
      }
    }).then((InterfaceData) => {
      let properties = JSON.parse(InterfaceData.dataValues.properties);
      let properties_fields = properties.fields;
      for (let i in properties_fields) {
        all_fields.push(properties_fields[i].pname);
      }
    }));
    promises.push(Event_Model.findAll({
      attributes: [['id', 'eventid']],
      where: {
        diid: diid
      }
    }).then((EventData) => {
      for (let i in EventData) {
        all_eventids.push(EventData[i].dataValues.eventid);
      }
    }));
    promises.push(LabelRefer.findAll({
      attributes: ['label_id'],
      where: {
        diid: diid
      }
    }).then((Data) => {
      LabelReferData = Data;
    }, () => {
      res.status(500).send(trans.databaseError);
    }));

    sequelize.Promise.all(promises).then(() => {
      for (let i in LabelReferData) {
        QueryLabelFields(i, LabelReferData, label_promises, res);
      }
      sequelize.Promise.all(label_promises).then((LabelData) => {
        for (let i in LabelData) {
          let LabelItems = JSON.parse(LabelData[i].dataValues.properties).labelItems;
          for (let j in LabelItems) {
            all_fields.push(LabelItems[j].pvalue);
          }
        }
        StreamData.all_eventids = all_eventids;
        StreamData.all_fields = all_fields;
        res.status(200).send(StreamData);
      }, () => {
        res.status(500).send(trans.databaseError);
      });
    }, () => {
      res.status(500).send(trans.databaseError);
    });
  });
});

module.exports = router;
