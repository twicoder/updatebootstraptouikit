"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let crypto = require('crypto');
let Job = require('../model/STREAM_JOB')(sequelize, Sequelize);
let SysConfig = require('../model/STREAM_SYSCONFIG')(sequelize, Sequelize);
let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let Label = require('../model/STREAM_LABEL')(sequelize, Sequelize);
let EventDef = require('../model/STREAM_EVENT')(sequelize, Sequelize);
let randomstring = require("randomstring");
let config = require('../config');
let trans = config[config.trans || 'zh'];
let router = express.Router();
let moment = require('moment');
const _getRunningTime = require('../common/funcs')._getRunningTimeStormJob;
const _getRunningTimeStormJobFromOneJob = require('../common/funcs')._getRunningTimeStormJobFromOneJob;
const handleAdvancedProperties = require('../common/funcs').handleAdvancedProperties;
const handleAdvancedPropertiesOfInput = require('../common/funcs').handleAdvancedPropertiesOfInput;
const dealDataInterfaceProperties = require("../common/funcs").dealDataInterfaceProperties;

router.post('/change/:id', function (req, res) {
  let status = req.body.status;
  let username = req.query.username;
  let usertype = req.query.usertype;

  sequelize.transaction(function (t) {
    return Job.find({ where: { id: req.params.id }, transaction: t }).then(function (job) {
      let result = job.dataValues;
      result.status = status;
      if (result.owner !== username || usertype === "admin") {
        return sequelize.Promise.reject();// Only owner can change status
      }
      if(result.status === 'STOP'){
        result.stop_time = 0;
      } else if(result.status === 'START'){
        result.start_time = 0;
      }

      return Job.update(result, { where: { id: req.params.id }, transaction: t });
    });
  }).then(function () {
    res.send({ success: true });
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
  Job.findAll({ attributes: ['id', 'status', 'start_time', 'stop_time'], where: searchOptionByUser }).then(function (jobs) {
    _getRunningTime(jobs);
    res.send(jobs);
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
  Job.find({ attributes: ['id', 'status', 'start_time', 'stop_time'], where: searchOptionByUser }).then(function (targetJob) {
    _getRunningTimeStormJobFromOneJob(targetJob);
    res.send(targetJob);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

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

  // update pname/pvalue from customParamsKV,
  // if not exists in events[i].PROPERTIES.props, then push into it
  if(events[i].output && events[i].output.customParamsKV){
    events[i].output.customParamsKV.forEach( (oneProperty) => {
      let pnameAlreadyExists = false;
      events[i].PROPERTIES.props.forEach( (existingProperty) => {
        if(existingProperty.pname === oneProperty.pname){
          existingProperty.pvalue = oneProperty.pvalue;
          pnameAlreadyExists = true;
        }
      });
      if(!pnameAlreadyExists){
        events[i].PROPERTIES.props.push(oneProperty);
      }
    });
  }

  events[i].PROPERTIES = JSON.stringify(events[i].PROPERTIES);
}


function getSHASubString(content){
  var secretKey = crypto.randomBytes(16).toString('hex');
  return "group" + crypto.createHmac('sha1', secretKey).update(content).digest().toString('base64').substr(0,8);
}

router.put("/", function (req, res) {
  let job = req.body.job;
  delete job.status;
  let sysconfigData = {
    id: job.sys_fk,
    config: JSON.stringify(job.sysConfigureProps)
  };
  let inputInterface = job.input;
  if(inputInterface.groupid && inputInterface.groupid.replace(/\s*/g,'') === '' || !inputInterface.groupid){
    inputInterface.groupid = getSHASubString(job.name);
  }
  let labels = job.labels;
  let events = job.events;

  return sequelize.transaction(function (t) {
    let promises = [];
    promises.push(Label.max("id", { transaction: t }));
    promises.push(EventDef.findAll({ where: { diid: inputInterface.id }, transaction: t }));
    if (inputInterface.datasource !== undefined && inputInterface.datasource.id !== undefined) {
      dealDataInterfaceProperties(inputInterface, inputInterface.datasource.id, 0);
    } else {
      dealDataInterfaceProperties(inputInterface, null, 0);
    }
    handleAdvancedPropertiesOfInput(inputInterface);
    promises.push(Interface.update(inputInterface, { where: { id: inputInterface.id }, transaction: t }));
    promises.push(SysConfig.update(sysconfigData, { where: { id: sysconfigData.id }, transaction: t }));
    promises.push(Label.destroy({ where: { diid: inputInterface.id }, transaction: t }));
    createOrUpdateOutputDataInterface(events, t, promises);
    promises.push(Job.update(job, { where: { id: job.id } }));
    return sequelize.Promise.all(promises).then(function (result) {
      let promises1 = [];
      //create label after delete
      createLabel(labels, inputInterface, t, promises1, result[0]);
      //create or update events
      for (let i = 0; i < events.length; i++) {
        if (result[i + 5].dataValues !== undefined && result[i + 5].dataValues.id !== undefined) {
          events[i].output.id = result[i + 5].dataValues.id;
        }
        createEvents(events, i, inputInterface.id, events[i].status ? 1 : 0);
        if (events[i].id === undefined || events[i].id === null) {
          promises1.push(EventDef.create(events[i], { transaction: t }));
        } else {
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
            promises1.push(EventDef.destroy({ where: { id: result[1][i].dataValues.id }, transaction: t }));
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
    res.send({ success: true });
  });
});

router.post("/", function (req, res) {
  let labels = req.body.task.outputLabels;
  let job = req.body.task;
  let inputInterface = req.body.task.input;
  inputInterface.groupid = getSHASubString(job.name);
  let events = req.body.task.events;

  let username = req.query.username;
  let usertype = req.query.usertype;
  if (usertype === "admin" && false) {
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
      inputInterface.name = job.name + "_" + randomstring.generate(10);
      const dummySysConfig = {
        id: randomstring.generate(10),
        config: '{"topo.ruleBoltConfig.numberTasks":"6","topo.spoutConfig.numberTasks":"6","topo.maxSpoutPending":"100","topo":{"formatBoltConfig":{"id":"Format","executors":2,"maxTaskParallelism":1,"numberTasks":"2"},"droppedBoltConfig":{"id":"Dropped","executors":2,"maxTaskParallelism":1,"numberTasks":"2"},"filterBoltConfig":{"id":"Filter","executors":2,"maxTaskParallelism":1,"numberTasks":2},"tagBoltConfig":{"id":"Tag","executors":2,"maxTaskParallelism":1,"numberTasks":2},"postFilterConfig":{"id":"PostFilter","executors":2,"maxTaskParallelism":1,"numberTasks":2},"eventBoltConfig":{"id":"Event","executors":2,"maxTaskParallelism":1,"numberTasks":2},"errorBoltConfig":{"id":"Error","executors":2,"maxTaskParallelism":1,"numberTasks":2},"droppedBoltConfig":{"id":"Discard","executors":2,"maxTaskParallelism":1,"numberTasks":2},"numberOfWorkers":"2","numberOfAckers":"1","spoutConfig":{"server":"","numberTasks":"5","executors":"2","groupid":"ocspgroupid","maxTaskParallelism":"5","topic":"general_rspc","serializer":"kafka.serializer.StringEncoder","id":"KAFKA"},"maxSpoutPending":"100","topoName":"OCSP_STREAM_CORE"},"zkConfig.port":"2181","topo.spoutConfig.groupid":"rspcgroupid","topo.spoutConfig.maxTaskParallelism":"6","topo.spoutConfig.id":"KAFKA","stormUiServer":"","zkConfig.brokerPath":"/brokers","topo.spoutConfig.serializer":"kafka.serializer.StringEncoder","topo.ruleBoltConfig.maxTaskParallelism":"6","topo.numberOfWorkers":"4","topo.spoutConfig.server":"","topo.spoutConfig.topic":"general_rspc","topo.ruleBoltConfig.id":"RULE","zkConfig":{"servers":"","port":"2181","brokerPath":"/brokers","stormzkpath":"/stormzk/rspc_topo22"}}'
      };
      return sequelize.Promise.all([
        Interface.create(inputInterface, { transaction: t }),
        Label.max("id", { transaction: t }),
        SysConfig.create(dummySysConfig, { transaction: t })]).then(function (di) {
          let promises = [];
          // create outputs
          createOrUpdateOutputDataInterface(events, t, promises);
          // create labels
          createLabel(labels, di[0], t, promises, di[1]);
          // create job
          job.id = randomstring.generate(10);
          job.status = "STOPPED";
          job.diid_fk = di[0].id;
          job.sys_fk = dummySysConfig.id;
          job.recover_mode = "from_latest";
          job.owner = username;

          promises.push(Job.create(job, { transaction: t }));
          return sequelize.Promise.all(promises).then(function (result) {
            let eventPromises = [];
            for (let i in events) {
              events[i].output.id = result[i].dataValues.id;
              events[i].owner = req.query.username;
              createEvents(events, i, job.diid_fk, 1);
              eventPromises.push(EventDef.create(events[i], { transaction: t }));
            }
            return sequelize.Promise.all(eventPromises);
          });
        });
    }).then(function () {
      res.send({ success: true });
    }).catch(function (err) {
      console.log(err);
      res.status(500).send(trans.databaseError);
    });
  }
});


module.exports = router;