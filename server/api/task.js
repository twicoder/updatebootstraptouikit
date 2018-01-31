"use strict";
let express = require('express');
let crypto = require('crypto');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let Task = require('../model/STREAM_TASK')(sequelize, Sequelize);
let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Label = require('../model/STREAM_LABEL')(sequelize, Sequelize);
let EventDef = require('../model/STREAM_EVENT')(sequelize, Sequelize);
let randomstring = require("randomstring");
let config = require('../config');
let trans = config[config.trans || 'zh'];
let moment = require('moment');
let CEP = require('../model/STREAM_EVENT_CEP')(sequelize, Sequelize);
let History = require('../model/STREAM_HISTORY_CONFIG')(sequelize, Sequelize);
let Datasource = require('../model/STREAM_DATASOURCE')(sequelize, Sequelize);
EventDef.hasOne(CEP, { foreignKey: 'event_id', targetKey: 'id' });
let router = express.Router();
const _getRunningTime = require('../common/funcs')._getRunningTime;
const _getRunningTimeFromTask = require('../common/funcs')._getRunningTimeFromTask;
const handleAdvancedProperties = require('../common/funcs').handleAdvancedProperties;
const handleAdvancedPropertiesOfInput = require('../common/funcs').handleAdvancedPropertiesOfInput;
const dealDataInterfaceProperties = require("../common/funcs").dealDataInterfaceProperties;

let isPNameExists = function (propslist, pname) {
  for (let i in propslist) {
    if (propslist[i].pname === pname) {
      return true;
    }
  }
  return false;
};

let mergeDBProps = function (targetProps, dbProps) {

  for (let i in dbProps.props) {
    if (!isPNameExists(targetProps.props, dbProps.props[i].pname)) {
      targetProps.props.push(dbProps.props[i]);
    }
  }

  return targetProps;
};

router.get('/', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let searchOptionByUser = {};
  if (usertype !== "admin") {
    searchOptionByUser = { owner: username };
  }
  Task.findAll({ where: searchOptionByUser }).then((tasks) => {
    _getRunningTime(tasks);
    res.send(tasks);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/status', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let searchOptionByUser = {};
  if (usertype !== "admin") {
    searchOptionByUser = { owner: username };
  }
  Task.findAll({ attributes: ['id', 'status', 'start_time', 'stop_time'], where: searchOptionByUser }).then(function (tasks) {
    _getRunningTime(tasks);
    res.send(tasks);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/status/:id', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let searchOptionByUser = { id: req.params.id };
  if (usertype !== "admin") {
    searchOptionByUser.owner = username ;
  }
  Task.find({ attributes: ['id', 'status', 'start_time', 'stop_time'], where: searchOptionByUser }).then(function (targetTask) {
    _getRunningTimeFromTask(targetTask);
    res.send(targetTask);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/change/:id', function (req, res) {
  let status = req.body.status;
  let username = req.query.username;
  let usertype = req.query.usertype;
  sequelize.transaction(function (t) {
    return Task.find({ where: { id: req.params.id }, transaction: t }).then(function (task) {
      let result = task.dataValues;
      if (result.status === 0 && status === 4) {// When task is in stop status, it cannot be restart.
        return sequelize.Promise.reject();
      }
      if (result.owner !== username || usertype === "admin") {
        return sequelize.Promise.reject();// Only owner can change status
      }
      if (status === "delete") {
        result.type = 0;
      } else {
        result.status = status;
        if (result.status === 1) {
          result.start_time = 0;
        } else if (result.status === 3) {
          result.stop_time = 0;
        }
      }
      return Task.update(result, { where: { id: req.params.id }, transaction: t });
    });
  }).then(function () {
    res.send({ success: true });
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});


function createLabel(labels, di, t, promises, value) {
  if (value === undefined || isNaN(value) || value === null) {
    value = 0;
  }
  for (let i in labels) {
    labels[i].label_id = labels[i].id;
    labels[i].id = parseInt(value) + parseInt(i) + 1;
    labels[i].diid = di.id;
    labels[i].status = 1;
    if (parseInt(i) !== 0) {
      labels[i].p_label_id = parseInt(value) + parseInt(i);
    }
    promises.push(Label.create(labels[i], { transaction: t }));
  }
}

function createEvents(events, i, diid, status) {
  events[i].p_event_id = parseInt(i);
  //Only events contains PROPERTIES instead pf properties
  events[i].PROPERTIES = { "props": [], "output_dis": [] };
  events[i].diid = diid;
  events[i].status = status;
  if (events[i].select_expr !== undefined && events[i].select_expr !== "") {
    events[i].select_expr = events[i].select_expr.replace(/\s/g, '');
  }
  if (events[i].delim === undefined) {
    events[i].delim = "";
  }
  if (events[i].output !== undefined && events[i].output.id !== undefined) {
    events[i].PROPERTIES.output_dis.push({
      "diid": events[i].output.id,
      "interval": events[i].interval,
      "delim": events[i].delim
    });
  }
  //Add data audit function
  if (events[i].audit !== undefined) {
    let result = {
      period: events[i].audit.type,
      time: []
    };
    if (events[i].audit.enableDate === 'have' && events[i].audit.startDate && events[i].audit.endDate) {
      result.startDate = moment(events[i].audit.startDate).format("YYYY-MM-DD");
      result.endDate = moment(events[i].audit.endDate).format("YYYY-MM-DD");
    }
    if (events[i].audit.type && events[i].audit.type !== "always" && events[i].audit.periods && events[i].audit.periods.length > 0) {
      for (let j = 0; j < events[i].audit.periods.length; j++) {
        let sd = "0";
        let ed = "0";
        if (events[i].audit.type === 'week' || events[i].audit.type === 'month') {
          sd = events[i].audit.periods[j].s;
          ed = events[i].audit.periods[j].d;
        }
        if (events[i].audit.type === 'none') {
          sd = moment(events[i].audit.periods[j].start).format("YYYY-MM-DD");
          ed = moment(events[i].audit.periods[j].end).format("YYYY-MM-DD");
        }
        let sh = moment(events[i].audit.periods[j].start).format("HH:mm:ss");
        let eh = moment(events[i].audit.periods[j].end).format("HH:mm:ss");
        result.time.push({
          begin: {
            d: sd,
            h: sh
          },
          end: {
            d: ed,
            h: eh
          }
        });
      }
    }
    events[i].PROPERTIES.props.push({
      "pname": "period",
      "pvalue": JSON.stringify(result)
    });
  }

  events[i].PROPERTIES = JSON.stringify(events[i].PROPERTIES);
}

function createOrUpdateOutputDataInterface(events, t, promises) {
  let promise = null;
  for (let i in events) {
    events[i].output.name = events[i].name + "_" + randomstring.generate(10);
    if (events[i].output.datasource !== undefined && events[i].output.datasource.id !== undefined) {
      dealDataInterfaceProperties(events[i].output, events[i].output.datasource.id, 1);
    } else {
      dealDataInterfaceProperties(events[i].output, null, 1);
    }
    if (events[i].output.id === undefined || events[i].output.id === null) {
      promise = Interface.create(events[i].output, { transaction: t });
    } else {
      promise = Interface.update(events[i].output, { where: { id: events[i].output.id }, transaction: t });
    }
    promises.push(promise);
  }
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

let _addHistory = function (id) {
  let eid = id;
  return EventDef.find({
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
    return sequelize.Promise.all([
      Interface.find({ where: { id: event.PROPERTIES.output_dis[0].diid } }),
      Interface.find({ where: { id: event.diid } }),
    ]).then((data) => {
      event.output = data[0].dataValues;
      event.input = data[1].dataValues.id;
      _parseProperties(event.output, event.output.properties);
      return sequelize.Promise.all([
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
        return History.create(history);
      });
    });
  });
};

let _CEPAdd = function (promises, data, i) {
  promises.push(CEP.findOrCreate({
    where: { event_id: data[i].dataValues.id },
    defaults: { event_id: data[i].dataValues.id },
  }).then(() => {
    return _addHistory(data[i].dataValues.id);
  }));
};

let _insertCEPandHistory = function (diid, res) {
  return EventDef.findAll({ where: { diid: diid } }).then((data) => {
    let promises = [];
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].dataValues) {
          _CEPAdd(promises, data, i);
        }
      }
    }
    return sequelize.Promise.all(promises).then(() => {
      res.send({ success: true });
    });
  });
};

function getSHASubString(content) {
  var secretKey = crypto.randomBytes(16).toString('hex');
  return "group" + crypto.createHmac('sha1', secretKey).update(content).digest().toString('base64').substr(0, 8);
}

router.post("/", function (req, res) {
  let labels = req.body.task.outputLabels;
  let task = req.body.task;
  let inputInterface = req.body.task.input;
  inputInterface.groupid = getSHASubString(task.name);
  let events = req.body.task.events;
  let usertype = req.query.usertype;
  if (usertype === "admin") {
    //admin cannot create tasks
    res.status(500).send(trans.authError);
  } else {
    // create input data interface
    sequelize.transaction(function (t) {
      if (inputInterface.datasource !== undefined && inputInterface.datasource.id !== undefined) {
        dealDataInterfaceProperties(inputInterface, inputInterface.datasource.id, 0);
      } else {
        dealDataInterfaceProperties(inputInterface, null, 0);
      }
      inputInterface.name = task.name + "_" + randomstring.generate(10);
      return sequelize.Promise.all([
        Interface.create(inputInterface, { transaction: t }),
        Label.max("id", { transaction: t })]).then(function (di) {
          let promises = [];
          // create outputs
          createOrUpdateOutputDataInterface(events, t, promises);
          // create labels
          createLabel(labels, di[0], t, promises, di[1]);
          // create task
          task.diid = di[0].id;
          task.type = 1;
          task.status = 0;
          task.queue = "default";
          task.owner = req.query.username;
          promises.push(Task.create(task, { transaction: t }));
          return sequelize.Promise.all(promises).then(function (result) {
            let eventPromises = [];
            for (let i in events) {
              events[i].output.id = result[i].dataValues.id;
              events[i].owner = req.query.username;
              createEvents(events, i, task.diid, 1);
              eventPromises.push(EventDef.create(events[i], { transaction: t }));
            }
            return sequelize.Promise.all(eventPromises);
          });
        });
    }).then(function () {
      _insertCEPandHistory(task.diid, res);
    }).catch(function (err) {
      console.log(err);
      res.status(500).send(trans.databaseError);
    });
  }
});



let _deleteEvent = function (promises1, result, i, t) {
  promises1.push(
    CEP.destroy({ where: { event_id: result[1][i].dataValues.id }, transaction: t }).then(function () {
      return EventDef.destroy({ where: { id: result[1][i].dataValues.id }, transaction: t });
    })
  );
};

router.put("/", function (req, res) {
  let task = req.body.task;
  let inputInterface = req.body.task.input;
  if (inputInterface.groupid && inputInterface.groupid.replace(/\s*/g, '') === '' || !inputInterface.groupid) {
    inputInterface.groupid = getSHASubString(task.name);
  }
  let interfaceDataFromDB = "{}";
  let labels = req.body.task.labels;
  let events = req.body.task.events;
  let eventIDs = [];
  for (let i in events) {
    eventIDs.push(events[i].id);
  }
  Interface.find({ attributes: ["properties"], where: { id: inputInterface.id } }).then((data) => {
    interfaceDataFromDB = data.dataValues.properties;
    EventDef.findAll({ attributes: ["id", "PROPERTIES"], where: { id: { $in: eventIDs } } }).then((eventsDataFromDB) => {
      Task.find({ attributes: ["owner"], where: { id: task.id } }).then((owner) => {
        if (owner && owner.dataValues && owner.dataValues.owner === req.query.username) {
          return sequelize.transaction(function (t) {
            let promises = [];
            promises.push(Label.max("id", { transaction: t }));
            promises.push(EventDef.findAll({ where: { diid: inputInterface.id }, transaction: t }));
            if (inputInterface.datasource !== undefined && inputInterface.datasource.id !== undefined) {
              dealDataInterfaceProperties(inputInterface, inputInterface.datasource.id, 0);
            } else {
              dealDataInterfaceProperties(inputInterface, null, 0);
            }
            // update interface data, but should not overwrite the properties we don't know
            let inputInterfacePropertiesProps = JSON.parse(inputInterface.properties);
            inputInterfacePropertiesProps.props = mergeDBProps(JSON.parse(inputInterface.properties).props, JSON.parse(interfaceDataFromDB).props);
            inputInterface.properties = JSON.stringify(inputInterfacePropertiesProps);
            handleAdvancedPropertiesOfInput(inputInterface);
            promises.push(Interface.update(inputInterface, { where: { id: inputInterface.id }, transaction: t }));
            promises.push(Task.update(task, { where: { id: task.id }, transaction: t }));
            promises.push(Label.destroy({ where: { diid: inputInterface.id }, transaction: t }));
            createOrUpdateOutputDataInterface(events, t, promises);
            return sequelize.Promise.all(promises).then(function (result) {
              let promises1 = [];
              //create label after delete
              createLabel(labels, inputInterface, t, promises1, result[0]);
              //create or update events
              for (let i = 0; i < events.length; i++) {
                if (result[i + 5].dataValues !== undefined && result[i + 5].dataValues.id !== undefined) {
                  events[i].output.id = result[i + 5].dataValues.id;
                }
                events[i].owner = req.query.username;
                createEvents(events, i, inputInterface.id, events[i].status ? 1 : 0);
                if (events[i].id === undefined || events[i].id === null) {
                  promises1.push(EventDef.create(events[i], { transaction: t }));
                } else {
                  for (let _idx in eventsDataFromDB) {
                    if (events[i].id === eventsDataFromDB[_idx].dataValues.id) {
                      events[i].PROPERTIES = JSON.stringify(mergeDBProps(JSON.parse(events[i].PROPERTIES), JSON.parse(eventsDataFromDB[_idx].dataValues.PROPERTIES)));
                    }
                  }
                  handleAdvancedProperties(events[i]);
                  promises1.push(EventDef.update(events[i], { where: { id: events[i].id }, transaction: t }));
                }
              }
              //deleted unused events
              for (let i in result[1]) {
                if (result[1][i].dataValues !== undefined && result[1][i].dataValues.id !== undefined) {
                  let flag = true;
                  for (let j in events) {
                    if (events[j].id !== undefined && result[1][i].dataValues.id === events[j].id) {
                      flag = false;
                      break;
                    }
                  }
                  if (flag) {
                    _deleteEvent(promises1, result, i, t);
                    if (result[1][i].dataValues.PROPERTIES !== undefined) {
                      let obj = JSON.parse(result[1][i].dataValues.PROPERTIES);
                      if (obj.output_dis !== undefined && obj.output_dis[0] !== undefined && obj.output_dis[0].diid !== undefined) {
                        promises1.push(Interface.destroy({ where: { id: obj.output_dis[0].diid }, transaction: t }));
                      }
                    }
                  }
                }
              }
              return sequelize.Promise.all(promises1);
            });
          }).then(function () {
            _insertCEPandHistory(inputInterface.id, res);
          });
        } else {
          console.error("Only stream owner can change stream properties");
          res.status(500).send(trans.authError);
        }
      }).catch(function (err) {
        console.error(err);
        res.status(500).send(trans.databaseError);
      });

    });
  }).catch(function (err) {
    console.log(err);
    res.status(500).send(trans.databaseError);
  });


});

module.exports = router;
