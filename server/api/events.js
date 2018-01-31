"use strict";

import express from "express";
import sequelize from "../sequelize";
import Sequelize from "sequelize";
import config from "../config";

let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Task = require('../model/STREAM_TASK')(sequelize, Sequelize);
let Event_Model = require('../model/STREAM_EVENT')(sequelize, Sequelize);
let randomstring = require("randomstring");
let CEP = require('../model/STREAM_EVENT_CEP')(sequelize, Sequelize);
Event_Model.hasOne(CEP, { foreignKey: 'event_id', targetKey: 'id' });
let moment = require('moment');
let trans = config[config.trans || 'zh'];
let router = express.Router();
let DataInterface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Datasource = require('../model/STREAM_DATASOURCE')(sequelize, Sequelize);
let History = require('../model/STREAM_HISTORY_CONFIG')(sequelize, Sequelize);

let _addPromise = function (promises, datainterface_id, AllEventData, i, datasource_id, topic, prefix, streamid, interval, delim, subscribe, eventData, result) {
  promises.push(sequelize.Promise.all([
    Interface.find({ attributes: [['dsid', 'datasource_id'], 'properties'], where: { id: datainterface_id } }),
    Task.find({ attributes: [['id', 'streamid']], where: { diid: AllEventData[i].diid } })
  ]).then((data) => {
    let tmp_interface = data[0].dataValues;
    datasource_id = tmp_interface.datasource_id;
    let properties = JSON.parse(tmp_interface.properties);
    //判断datasource类型,若为kafka则将名字赋给topic,若为codis则赋给prefix
    if (datasource_id === 1) {
      topic = properties.props[0].pvalue;
    }
    if (datasource_id === 2) {
      prefix = properties.props[0].pvalue;
    }
    streamid = data[1].dataValues.streamid;
    let output = {
      "datainterface_id": datainterface_id,
      "datasource_id": datasource_id,
      "topic": topic,
      "prefix": prefix,
      "interval": interval,
      "delim": delim,
      "subscribe": subscribe
    };
    eventData.streamid = streamid;
    eventData.output = output;
    delete eventData.PROPERTIES;
    result.push(eventData);
  }));
};

function QueryAllEventInfo(AllEventData, AllEventResult, res, startDate, endDate) {
  let result = [];
  let promises = [];
  for (let i = 0; i < AllEventData.length; i++) {
    let eventData = AllEventData[i].dataValues;
    if (eventData.STREAM_EVENT_CEP) {
      eventData.STREAM_EVENT_CEP = eventData.STREAM_EVENT_CEP.dataValues;
    }
    let PROPERTIES = JSON.parse(eventData.PROPERTIES);
    let output_dis = PROPERTIES.output_dis[0];
    let props = PROPERTIES.props;
    let interval = output_dis.interval;
    let datainterface_id = output_dis.diid;
    let delim = output_dis.delim;
    let subscribe;
    let datasource_id = '';
    let topic = '';
    let prefix = '';
    let streamid = '';
    let flag = false;
    for (let i in props) {
      if (props[i].pname === 'period') {
        subscribe = props[i].pvalue;
        if (startDate && endDate) {
          let parse = JSON.parse(subscribe);
          if (!(startDate.isBefore(parse.startDate, 'day') &&
            (endDate.isAfter(parse.endDate, 'day') || endDate.isSame(parse.endDate, 'day')))) {
            flag = true;
            break;
          }
        }
      }
    }
    if (!flag) {
      _addPromise(promises, datainterface_id, AllEventData, i, datasource_id, topic, prefix, streamid, interval, delim, subscribe, eventData, result);
    }
  }
  sequelize.Promise.all(promises).then(() => {
    AllEventResult.events = result;
    res.status(200).send(AllEventResult);
  }).catch(() => {
    res.status(500).send(trans.databaseError);
  });
}

function _parseProperties(datainterface, prop, type = "output") {
  if (datainterface.delim === "\\|") {
    datainterface.delim = "|";
  }
  datainterface.inputs = [];
  if (prop !== undefined && prop !== null) {
    prop = JSON.parse(prop);
    if (prop.fields !== undefined && prop.fields.length > 0) {
      datainterface.fields = "";
      if (prop.fields.length > 0) {
        datainterface.fields = prop.fields[0].pname;
      }
      for (let i = 1; i < prop.fields.length; i++) {
        if (prop.fields[i].pname !== undefined && prop.fields[i].pname.trim() !== "") {
          datainterface.fields += "," + prop.fields[i].pname;
        }
      }
    }
    if (prop.props !== undefined && prop.props.length > 0) {
      for (let i in prop.props) {
        if (prop.props[i].pname === "topic") {
          datainterface.topic = prop.props[i].pvalue;
        }
        if (prop.props[i].pname === "codisKeyPrefix") {
          datainterface.codisKeyPrefix = prop.props[i].pvalue;
        }
        else if (prop.props[i].pname === "uniqKeys") {
          datainterface.uniqueKey = prop.props[i].pvalue;
        }
      }
    }
    if (prop.sources !== undefined && prop.sources.length > 0 && type === "input") {
      for (let i = 0; i < prop.sources.length; i++) {
        let result = {
          topic: prop.sources[i].topic,
          name: prop.sources[i].pname,
          delim: prop.sources[i].delim === "\\|" ? "|" : prop.sources[i].delim,
          fields: "",
          userFields: []
        };
        if (prop.sources[i].fields !== undefined && prop.sources[i].fields.length > 0) {
          if (prop.sources[i].fields.length > 0) {
            result.fields = prop.sources[i].fields[0].pname;
          }
          for (let j = 1; j < prop.sources[i].fields.length; j++) {
            if (prop.sources[i].fields[j].pname !== undefined && prop.sources[i].fields[j].pname.trim() !== "") {
              result.fields += "," + prop.sources[i].fields[j].pname;
            }
          }
        }
        if (prop.sources[i].userFields !== undefined && prop.sources[i].userFields.length > 0) {
          for (let j = 0; j < prop.sources[i].userFields.length; j++) {
            result.userFields.push({
              name: prop.sources[i].userFields[j].pname,
              value: prop.sources[i].userFields[j].pvalue
            });
          }
        }
        datainterface.inputs.push(result);
      }
    }
  }
}

function _parseEvent(event) {
  if (event.PROPERTIES !== undefined && event.PROPERTIES !== null) {
    event.PROPERTIES = JSON.parse(event.PROPERTIES);
    if (event.PROPERTIES.props !== undefined && event.PROPERTIES.props.length > 0) {
      for (let j in event.PROPERTIES.props) {
        if (event.PROPERTIES.props[j].pname === "userKeyIdx") {
          event.userKeyIdx = event.PROPERTIES.props[j].pvalue;
        }
        if (event.PROPERTIES.props[j].pname === "period") {
          event.PROPERTIES.props[j].pvalue = JSON.parse(event.PROPERTIES.props[j].pvalue);
          event.audit = {
            type: event.PROPERTIES.props[j].pvalue.period,
            periods: []
          };
          if (event.PROPERTIES.props[j].pvalue.startDate && event.PROPERTIES.props[j].pvalue.endDate) {
            event.audit.enableDate = "have";
            event.audit.startDate = moment(event.PROPERTIES.props[j].pvalue.startDate).toDate();
            event.audit.endDate = moment(event.PROPERTIES.props[j].pvalue.endDate).toDate();
          } else {
            event.audit.enableDate = "none";
          }
          for (let w in event.PROPERTIES.props[j].pvalue.time) {
            let val = event.PROPERTIES.props[j].pvalue.time[w];
            event.audit.periods.push({
              s: val.begin.d,
              d: val.end.d,
              start: moment("2010-07-01 " + val.begin.h).toDate(),
              end: moment("2010-07-01 " + val.end.h).toDate()
            });
          }
        }
        if (event.PROPERTIES.props.length === 1) {
          event.audit = { type: "always", periods: [], enableDate: "none" };
        }
      }

      if (event.PROPERTIES.output_dis !== undefined && event.PROPERTIES.output_dis[0] !== undefined) {
        event.interval = event.PROPERTIES.output_dis[0].interval;
        event.delim = event.PROPERTIES.output_dis[0].delim;
        if (event.delim === "\\|") {
          event.delim = "|";
        }
      }
    }
  }
}

//Deprecated
router.delete('/:id', function (req, res) {
  Event_Model.destroy({
    where: {
      id: req.params.id
    }
  }).then(function () {
    res.status(204).send({ success: true });
  }, function () {
    res.status(500).send(trans.databaseError);
  });
});

let _addHistory = function (req, res, id) {
  let eid;
  if (id) {
    eid = id;
  } else {
    eid = req.params.id;
  }
  Event_Model.find({
    where: {
      id: eid
    },
    include: {
      model: CEP
    }
  }).then(function (data) {
    let event = data.dataValues;
    event.cep = {
      type: null
    };
    if (event.STREAM_EVENT_CEP) {
      event.cep = event.STREAM_EVENT_CEP.dataValues;
    }
    delete event.STREAM_EVENT_CEP;
    _parseEvent(event);
    sequelize.Promise.all([
      DataInterface.find({ where: { id: event.PROPERTIES.output_dis[0].diid } }),
      DataInterface.find({ where: { id: event.diid } }),
    ]).then((data) => {
      event.output = data[0].dataValues;
      event.input = data[1].dataValues.id;
      _parseProperties(event.output, event.output.properties);
      sequelize.Promise.all([
        Datasource.find({ where: { id: event.output.dsid } }),
        Task.find({ where: { diid: event.input } })
      ]).then((data) => {
        event.output.datasource = data[0].dataValues;
        event.task = data[1].dataValues;
        event.parent = {
          id: event.cep.type
        };
        delete event.PROPERTIES;
        delete event.input;
        let history = {};
        history.component_name = "event";
        history.user_name = event.owner;
        history.id = event.id;
        history.config_data = JSON.stringify(event);
        History.create(history).then(function () {
          res.status(202).send({ success: true, event: event });
        });
      });
    });
  });
};

function getKeysFromString(inputKeys) {
  let inputWithoutSpace = inputKeys.replace(/\s*/g, '');
  let outputKeys = inputWithoutSpace.split(',');
  return outputKeys;
}

function isKeysContainInAnotherKeysSet(checkKeys, allKeys) {
  let checkResult = true;
  if (checkKeys && allKeys) {
    checkKeys.forEach((keyNeedCheck) => {
      let targetKeyFound = false;
      allKeys.forEach((oneKeyFromAllKeys) => {
        if (keyNeedCheck === oneKeyFromAllKeys) {
          targetKeyFound = true;
        }
      });
      if (!targetKeyFound) {
        checkResult = false;
      }
    });
  }
  return checkResult;
}

function updateOrAddKeyValuePairs(oneKeyValuePair, props) {
  let isPNameExists = false;
  props.forEach((checkObj) => {
    if (checkObj.pname === oneKeyValuePair.pname) {
      isPNameExists = true;
      checkObj.pvalue = oneKeyValuePair.pvalue;
    }
  });
  if (!isPNameExists) {
    props.push(oneKeyValuePair);
  }
}

function handlePostRequest(req, res) {
  let streamid = req.body.streamid;
  let name = req.body.name;
  let select_expr = req.body.select_expr;
  let filter_expr = req.body.filter_expr;
  let p_event_id = req.body.p_event_id;
  let owner = req.body.owner;
  let status = req.body.status;
  let cep = req.body.STREAM_EVENT_CEP || {};
  let diid;
  let output = req.body.output;
  let subscribe = output.subscribe;

  if (!req.body.uniqKeys) {
    res.status(406).send({ success: false, event: {}, msg: '请检查uniqKeys字段是否存在' });
    return;
  }
  let userAssignedUniqKeys = req.body.uniqKeys;
  let legalKeys = getKeysFromString(select_expr);
  let userInputUniqKeys = getKeysFromString(userAssignedUniqKeys);
  let isUserAssignedUniqKeysValid = isKeysContainInAnotherKeysSet(userInputUniqKeys, legalKeys);

  // User input invalid uniqKeys
  if (!isUserAssignedUniqKeysValid) {
    res.status(406).send({ success: false, event: {}, msg: '请检查用户输入的uniqKeys是否包含在select_expr中' });
    return;
  }

  let userAssignedProps = req.body.props;
  let PROPERTIES = { "props": [], "output_dis": [] };
  userAssignedProps.forEach((oneKeyValuePair) => {
    updateOrAddKeyValuePairs(oneKeyValuePair, PROPERTIES.props);
  });

  let new_event = {};
  sequelize.transaction(function (t) {
    //先根据streamid查询对应输入源的diid
    return Task.find({ attributes: ['diid'], where: { id: streamid } }, { transaction: t }).then((data) => {
      diid = data.dataValues.diid;
      let properties = {
        props: [{ "pname": "", "pvalue": "" }, { "pname": "uniqKeys", "pvalue": userAssignedUniqKeys }],
        "userFields": [],
        "fields": []
      };
      if (output.datasource_id === 1) {
        properties.props[0].pname = "topic";
        properties.props[0].pvalue = output.topic;
      } else if (output.datasource_id === 2) {
        properties.props[0].pname = "prefix";
        properties.props[0].pvalue = output.prefix;
      }
      let datainterface = {
        "name": name + "_" + randomstring.generate(10),
        "type": 1,
        "dsid": output.datasource_id,
        "filter_expr": '',
        "description": '',
        "delim": output.delim,
        "status": 1,
        "properties": JSON.stringify(properties)
      };
      //先插入一个新的输出的datainterface
      return Interface.create(datainterface, { transaction: t }).then((data) => {
        //拿到新插入的datainterface的id作为event的输出diid
        let output_diid = data.dataValues.id;
        if (output.subscribe !== undefined && output.subscribe !== null) {
          PROPERTIES.props.push({ "pname": "period", "pvalue": JSON.stringify(subscribe) });
        }
        PROPERTIES.output_dis[0] = { "diid": output_diid, "interval": output.interval, "delim": output.delim };
        new_event = {
          "name": name,
          "select_expr": select_expr,
          "filter_expr": filter_expr,
          "p_event_id": p_event_id,
          "diid": diid,
          "status": status,
          "PROPERTIES": JSON.stringify(PROPERTIES),
          "STREAM_EVENT_CEP": cep,
          "owner": owner
        };
        //插入一个新的event
        return Event_Model.create(new_event, { transaction: t }).then((data) => {
          if (data.dataValues && data.dataValues.id) {
            new_event.STREAM_EVENT_CEP.event_id = data.dataValues.id;
            return CEP.create(new_event.STREAM_EVENT_CEP, { transaction: t }).then(function () {
              _addHistory(req, res, data.dataValues.id);
            });
          } else {
            return sequelize.Promise.reject();
          }
        });
      });
    });
  }).catch(function () {
    res.status(500).send(trans.databaseError);
  });
}


function validatePostRequest(data) {
  let isValid = true;
  let missingFields = [];
  // "p_event_id" can be ignored
  if (!!!data.p_event_id) {
    data.p_event_id = 0;
  }
  let fieldsMustExists = ["streamid", "name", "uniqKeys", "select_expr", "STREAM_EVENT_CEP", "output", "status", "owner"];
  fieldsMustExists.forEach((item) => {
    if (typeof(data[item]) === "undefined" && item !== 'status') {
      isValid = false;
      missingFields.push(item);
    }
    if (item === "output" && data.output && typeof (data.output.datasource_id) === "undefined") {
      isValid = false;
      missingFields.push("output.datasource_id");
    }
  });

  return {
    "isValid": isValid,
    "missingFields": missingFields
  };
}

function validatePutRequest(data) {
  let isValid = true;
  // 如果数据中有output字段，则必须有output.datainterface_id字段，否则认定为数据格式错误
  if (data.output && typeof(data.output.datainterface_id) === 'undefined') {
    isValid = false;
  }
  return isValid;
}

router.post('/', function (req, res) {
  let validResult = validatePostRequest(req.body);
  if (validResult.isValid) {
    handlePostRequest(req, res);
  } else {
    res.status(406).send({
      "success": false,
      "msg": "input data validation failed,missing:" + JSON.stringify(validResult.missingFields)
    });
  }

});



function _upsert(values, condition) {
  return CEP.findOne({ where: condition })
    .then(function (obj) {
      if (obj) { // update
        return CEP.update(values, { where: condition });
      }
      else { // insert
        return CEP.create(values);
      }
    });
}


function handlePutRequest(req, res) {
  let new_event = {};

  if (req.body.name !== null && req.body.name !== undefined) {
    new_event.name = req.body.name;
  }
  if (req.body.select_expr !== null && req.body.select_expr !== undefined) {
    new_event.select_expr = req.body.select_expr;
  }
  if (req.body.filter_expr !== null && req.body.filter_expr !== undefined) {
    new_event.filter_expr = req.body.filter_expr;
  }
  if (req.body.p_event_id !== null && req.body.p_event_id !== undefined) {
    new_event.p_event_id = req.body.p_event_id;
  }
  if (req.body.status !== null && req.body.status !== undefined) {
    new_event.status = req.body.status;
  }
  if (req.body.description !== null && req.body.description !== undefined) {
    new_event.description = req.body.description;
  }
  if (req.body.STREAM_EVENT_CEP !== null && req.body.STREAM_EVENT_CEP !== undefined) {
    new_event.STREAM_EVENT_CEP = req.body.STREAM_EVENT_CEP;
  } else {
    new_event.STREAM_EVENT_CEP = {};
  }
  new_event.STREAM_EVENT_CEP.event_id = req.params.id;
  if (req.body.owner !== null && req.body.owner !== undefined) {
    new_event.owner = req.body.owner;
  }
  let output;

  //Chinwe:更新new_event时需要考虑属性PROPERTIE的覆盖问题
  let PROPERTIES = { "props": [], "output_dis": [] };
  Event_Model.find({ attributes: ['select_expr', 'PROPERTIES'], where: { id: req.params.id } }).then((data) => {
    if (data) {
      PROPERTIES = JSON.parse(data.dataValues.PROPERTIES);
    }

    if (req.body.props) {
      req.body.props.forEach((oneKeyValuePair) => {
        updateOrAddKeyValuePairs(oneKeyValuePair, PROPERTIES.props);
      });
    }


    if (req.body.output !== null && req.body.output !== undefined) {
      output = req.body.output;
      if (output.subscribe !== undefined && output.subscribe !== null) {
        updateOrAddKeyValuePairs({ "pname": "period", "pvalue": JSON.stringify(output.subscribe) }, PROPERTIES.props);
      }
      if (!PROPERTIES.output_dis) {
        PROPERTIES.output_dis = [];
      }
      PROPERTIES.output_dis[0] = { "diid": output.datainterface_id, "interval": output.interval, "delim": output.delim };
    }

    new_event.PROPERTIES = JSON.stringify(PROPERTIES);

    // 如果用户提供了uniqKeys
    if (req.body.uniqKeys) {
      let userAssignedUniqKeys = req.body.uniqKeys;
      let legalKeys = getKeysFromString(data.dataValues.select_expr);
      let userInputUniqKeys = getKeysFromString(userAssignedUniqKeys);
      let isUserAssignedUniqKeysValid = isKeysContainInAnotherKeysSet(userInputUniqKeys, legalKeys);
      if (!isUserAssignedUniqKeysValid) {
        res.status(500).send({ success: false, event: {}, msg: '请检查用户输入的uniqKeys是否包含在select_expr中' });
      } else {
        let dataInterfaceIdForCurrentEvent = PROPERTIES.output_dis[0].diid;
        if (dataInterfaceIdForCurrentEvent) {
          Interface.find({ attributes: ['properties'], where: { id: dataInterfaceIdForCurrentEvent } }).then(function (data) {
            let dataInterfaceProps = JSON.parse(data.dataValues.properties);
            if (dataInterfaceProps.props) {
              dataInterfaceProps.props.forEach(function (oneProp) {
                if (oneProp.pname === 'uniqKeys') {
                  oneProp.pvalue = userAssignedUniqKeys;
                }
              });
            } else {
              console.error('Error handle props');
            }

            var updatedDataInterface = {
              id: dataInterfaceIdForCurrentEvent,
              properties: JSON.stringify(dataInterfaceProps)
            };

            Interface.update(updatedDataInterface, { where: { id: dataInterfaceIdForCurrentEvent } }).then(function () {

              if (req.body.streamid !== null && req.body.streamid !== undefined) {
                Task.find({ attributes: ['diid'], where: { id: req.body.streamid } }).then(function (data) {
                  new_event.diid = data.dataValues.diid;
                  sequelize.Promise.all([Event_Model.update(new_event, { where: { id: req.params.id } }), _upsert(new_event.STREAM_EVENT_CEP, { event_id: req.params.id })]).then(function () {
                    _addHistory(req, res);
                  });
                }).catch(function () {
                  res.status(500).send(trans.databaseError);
                });
              } else {
                new_event.id = req.params.id;
                sequelize.Promise.all([Event_Model.update(new_event, { where: { id: req.params.id } }), _upsert(new_event.STREAM_EVENT_CEP, { event_id: req.params.id })]).then(function () {
                  _addHistory(req, res);
                }).catch(function () {
                  res.status(500).send(trans.databaseError);
                });
              }
            });
          });
        } else {
          res.status(406).send({ success: false, event: {}, msg: '请检查用户输入的output.datainterface_id是否存在' });
          return;
        }
      }
    } else {
      if (req.body.streamid !== null && req.body.streamid !== undefined) {
        Task.find({ attributes: ['diid'], where: { id: req.body.streamid } }).then(function (data) {
          new_event.diid = data.dataValues.diid;
          sequelize.Promise.all([Event_Model.update(new_event, { where: { id: req.params.id } }), _upsert(new_event.STREAM_EVENT_CEP, { event_id: req.params.id })]).then(function () {
            _addHistory(req, res);
          });
        }).catch(function () {
          res.status(500).send(trans.databaseError);
        });
      } else {
        new_event.id = req.params.id;
        sequelize.Promise.all([Event_Model.update(new_event, { where: { id: req.params.id } }), _upsert(new_event.STREAM_EVENT_CEP, { event_id: req.params.id })]).then(function () {
          _addHistory(req, res);
        }).catch(function () {
          res.status(500).send(trans.databaseError);
        });
      }
    }

  });
}

router.put('/:id', function (req, res) {

  if (validatePutRequest(req.body)) {
    handlePutRequest(req, res);
  } else {
    res.status(406).send({
      "success": false,
      "msg": "input data validation failed"
    });
  }
});


//获取所有事件信息
router.get('/', function (req, res) {
  let page_size = parseInt(req.query.page_size || 15);
  let page = parseInt(req.query.page || 1);
  let limit = page_size;
  let offset = (page - 1) * page_size;
  let searchObj = {}, searchCep = {};
  if (req.query.name) {
    searchObj.name = req.query.name;
  }
  if (req.query.status) {
    searchObj.status = parseInt(req.query.status);
  }
  if (req.query.source) {
    searchCep.source = req.query.source;
  }
  if (req.query.badgeNumber) {
    searchCep.badge_number = req.query.badgeNumber;
  }
  if (req.query.type) {
    searchCep.type = req.query.type;
  }
  Event_Model.findAll({
    attributes: [['id', 'eventid'], 'diid', 'name', 'select_expr', 'filter_expr', 'p_event_id', 'PROPERTIES', 'status', 'description'],
    limit: limit,
    offset: offset,
    include: [{
      model: CEP,
      where: searchCep
    }],
    where: searchObj
  }).then((AllEventData) => {
    let AllEventResult = { "pageSize": "", "totalPageNumber": "", "currentPage": "", "events": [] };
    AllEventResult.pageSize = page_size;
    AllEventResult.currentPage = page;
    AllEventResult.totalPageNumber = Math.ceil(AllEventData.length / page_size);
    let startDate = null, endDate = null;
    if (req.query.startDate) {
      startDate = moment(req.query.startDate);
    }
    if (req.query.endDate) {
      endDate = moment(req.query.endDate);
    }
    QueryAllEventInfo(AllEventData, AllEventResult, res, startDate, endDate);
  }).catch(function () {
    res.status(500).send(trans.databaseError);
  });
});

//根据事件id获取事件信息
router.get('/:id', function (req, res) {
  Event_Model.find({
    attributes: [['id', 'eventid'], 'diid', 'name', 'select_expr', 'filter_expr', 'p_event_id', 'PROPERTIES', 'status', 'description'],
    where: {
      id: req.params.id
    },
    include: {
      model: CEP
    }
  }).then((Event) => {
    if(!Event){
      res.status(404).send({});
      return;
    }
    let tmp_event = Event.dataValues;
    let eventid = tmp_event.eventid;
    let name = tmp_event.name;
    let select_expr = tmp_event.select_expr;
    let filter_expr = tmp_event.filter_expr;
    let p_event_id = tmp_event.p_event_id;
    let status = tmp_event.status;
    let description = tmp_event.description;
    let STREAM_EVENT_CEP = tmp_event.STREAM_EVENT_CEP;
    let PROPERTIES = JSON.parse(tmp_event.PROPERTIES);
    let output_dis = PROPERTIES.output_dis[0];
    let props = PROPERTIES.props;
    let subscribe = '';
    for (let i in props) {
      if (props[i].pname === 'period') {
        subscribe = props[i].pvalue;
      }
    }
    let interval = output_dis.interval;
    let datainterface_id = output_dis.diid;
    let delim = output_dis.delim;
    let datasource_id = '';
    let topic = '';
    let prefix = '';
    let streamid = '';
    //将查询task表与datainterface表装进promises
    let promises = [];
    promises.push(Interface.find({
      attributes: [['dsid', 'datasource_id'], 'properties'],
      where: { id: datainterface_id }
    }).then((data) => {
      let tmp_interface = data.dataValues;
      datasource_id = tmp_interface.datasource_id;
      let properties = JSON.parse(tmp_interface.properties);
      //判断datasource类型,若为kafka则将名字赋给topic,若为codis则赋给prefix
      if (datasource_id === 1) {
        topic = properties.props[0].pvalue;
      }
      if (datasource_id === 2) {
        prefix = properties.props[0].pvalue;
      }
    }));
    promises.push(Task.find({ attributes: [['id', 'streamid']], where: { diid: Event.diid } }).then((data) => {
      streamid = data.dataValues.streamid;
    }));
    sequelize.Promise.all(promises).then(() => {
      let output = {
        "datainterface_id": datainterface_id,
        "datasource_id": datasource_id,
        "topic": topic,
        "prefix": prefix,
        "interval": interval,
        "delim": delim,
        "subscribe": subscribe
      };
      res.status(200).send({
        eventid,
        streamid,
        name,
        select_expr,
        filter_expr,
        p_event_id,
        output,
        status,
        description,
        STREAM_EVENT_CEP
      });
    });
  }, () => {
    res.status(500).send(trans.databaseError);
  }
    ).catch(function () {
      res.status(500).send(trans.databaseError);
    });
});


module.exports = router;
