"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let EventDef = require('../model/STREAM_EVENT')(sequelize, Sequelize);
let CEP = require('../model/STREAM_EVENT_CEP')(sequelize, Sequelize);
let Interface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let randomstring = require("randomstring");
let config = require('../config');
let trans = config[config.trans || 'zh'];
let moment = require('moment');

let router = express.Router();
EventDef.hasOne(CEP, { foreignKey: 'event_id', targetKey: 'id' });

router.get('/diid/:id', function (req, res) {
  EventDef.findAll({
    where: {
      diid: req.params.id
    }
  }).then(function (events) {
    res.send(events);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/cep/:code', function (req, res) {
  CEP.find({
    where: {
      code: req.params.code
    }
  }).then(function (events) {
    if (events === null) {
      res.send({});
    } else {
      res.send(events);
    }
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/change/:id', function (req, res) {
  let status = req.body.status;
  sequelize.transaction(function (t) {
    return EventDef.find({ where: { id: req.params.id }, transaction: t }).then(function (event) {
      let result = event.dataValues;
      if (result.status === status) {
        return sequelize.Promise.reject();
      }
      result.status = status;
      return EventDef.update(result, { where: { id: req.params.id }, transaction: t });
    });
  }).then(function () {
    res.send({ success: true });
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/changeevents/', function (req, res) {

  let status = req.body.status;
  let eventsNeedUpdate = req.body.events;
  let eventIDs = [];
  if (eventsNeedUpdate) {
    eventsNeedUpdate.forEach((event) => {
      eventIDs.push(event.id);
    });
  }

  EventDef.update(
    {
      "status": status
    }, {
      where: {
        id: {
          '$in': eventIDs
        }
      }
    }).then(function () {
      res.send({ success: true });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });

});

function _createEvent(event, status) {
  event.p_event_id = 0;
  //Only event contains PROPERTIES instead pf properties
  event.PROPERTIES = { "props": [], "output_dis": [] };
  if (event.task) {
    event.diid = event.task.diid;
  }
  event.status = status;
  if (event.select_expr !== undefined && event.select_expr !== "") {
    event.select_expr = event.select_expr.replace(/\s/g, '');
  }
  if (event.delim === undefined) {
    event.delim = "";
  }
  if (event.output !== undefined && event.output.id !== undefined) {
    event.PROPERTIES.output_dis.push({
      "diid": event.output.id,
      "interval": event.interval,
      "delim": event.delim
    });
  }
  //Add data audit function
  if (event.audit !== undefined) {
    let result = {
      period: event.audit.type,
      time: []
    };
    if (event.audit.enableDate === 'have' && event.audit.startDate && event.audit.endDate) {
      result.startDate = moment(event.audit.startDate).format("YYYY-MM-DD");
      result.endDate = moment(event.audit.endDate).format("YYYY-MM-DD");
    }
    if (event.audit.type && event.audit.type !== "always" && event.audit.periods && event.audit.periods.length > 0) {
      for (let j = 0; j < event.audit.periods.length; j++) {
        let sd = "0";
        let ed = "0";
        if (event.audit.type === 'week' || event.audit.type === 'month') {
          sd = event.audit.periods[j].s;
          ed = event.audit.periods[j].d;
        }
        let sh = moment(event.audit.periods[j].start).format("HH:mm:ss");
        let eh = moment(event.audit.periods[j].end).format("HH:mm:ss");
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
    event.PROPERTIES.props.push({
      "pname": "period",
      "pvalue": JSON.stringify(result)
    });
  }
  event.PROPERTIES = JSON.stringify(event.PROPERTIES);
}

function _dealDataInterfaceProperties(dataInterface, dsid, type) {
  dataInterface.dsid = dsid;
  dataInterface.type = type;
  dataInterface.status = 1;
  dataInterface.properties = { "props": [], "userFields": [], "fields": [] };
  if (dataInterface.delim !== undefined && dataInterface.delim === "|") {
    dataInterface.delim = "\\|";
  }
  if (dataInterface.delim === undefined) {
    dataInterface.delim = "";
  }
  let _parseFields = function (properties, fields, name) {
    if (fields === undefined) {
      return [];
    }
    fields = fields.replace(/\s/g, '');
    let splits = fields.split(",");
    for (let i in splits) {
      if (splits[i] !== undefined && splits[i] !== "") {
        properties[name].push({
          "pname": splits[i].trim(),
          "ptype": "String"
        });
      }
    }
    return splits;
  };
  if (dataInterface.topic !== undefined) {
    dataInterface.properties.props.push({
      "pname": "topic",
      "pvalue": dataInterface.topic
    });
  }
  if (dataInterface.uniqueKey !== undefined) {
    dataInterface.properties.props.push({
      "pname": "uniqKeys",
      "pvalue": dataInterface.uniqueKey
    });
  }
  if (dataInterface.codisKeyPrefix !== undefined) {
    dataInterface.properties.props.push({
      "pname": "codisKeyPrefix",
      "pvalue": dataInterface.codisKeyPrefix
    });
  }
  if (dataInterface.inputs !== undefined && dataInterface.inputs.length > 0) {
    dataInterface.properties.sources = [];
    for (let i in dataInterface.inputs) {
      if (dataInterface.inputs[i].delim !== undefined && dataInterface.inputs[i].delim === "|") {
        dataInterface.inputs[i].delim = "\\|";
      }
      if (dataInterface.inputs[i].delim === undefined) {
        dataInterface.inputs[i].delim = "";
      }
      let result = {
        "pname": dataInterface.inputs[i].name,
        "delim": dataInterface.inputs[i].delim,
        "topic": dataInterface.inputs[i].topic,
        "userFields": [],
        "fields": []
      };
      _parseFields(result, dataInterface.inputs[i].fields, "fields");
      if (dataInterface.inputs[i].userFields !== undefined && dataInterface.inputs[i].userFields.length > 0) {
        for (let j in dataInterface.inputs[i].userFields) {
          result.userFields.push({
            "pname": dataInterface.inputs[i].userFields[j].name,
            "pvalue": dataInterface.inputs[i].userFields[j].value,
            "undefined": "on"
          });
        }
      }
      dataInterface.properties.sources.push(result);
    }
  }
  dataInterface.properties = JSON.stringify(dataInterface.properties);
}

function _createOrUpdateOutputDataInterface(event, t) {
  event.output.name = event.name + "_" + randomstring.generate(10);
  if (event.output.datasource !== undefined && event.output.datasource.id !== undefined) {
    _dealDataInterfaceProperties(event.output, event.output.datasource.id, 1);
  } else {
    _dealDataInterfaceProperties(event.output, null, 1);
  }
  if (event.output.id === undefined || event.output.id === null) {
    return Interface.create(event.output, { transaction: t });
  } else {
    return Interface.update(event.output, { where: { id: event.output.id }, transaction: t }).then(function () {
      return {
        dataValues: event.output
      };
    });
  }
}

let mergeDBProps = function (targetProps, dbProps) {

  let isPNameExists = function (propslist, pname) {
    for (let i in propslist) {
      if (propslist[i].pname === pname) {
        return true;
      }
    }
    return false;
  };

  for (let i in dbProps.props) {
    if (!isPNameExists(targetProps.props, dbProps.props[i].pname)) {
      targetProps.props.push(dbProps.props[i]);
    }
  }

  return targetProps;
};

router.put('/:id', function (req, res) {
  let event = req.body.event;
  EventDef.find({ attributes: ["owner", "PROPERTIES"], where: { id: event.id } }).then((owner) => {
    if (owner && owner.dataValues && owner.dataValues.owner === req.query.username) {
      return sequelize.transaction(function (t) {
        return _createOrUpdateOutputDataInterface(event, t).then(function (result) {
          event.output = result.dataValues;
          _createEvent(event, event.status ? 1 : 0);
          if (event.parent) {
            event.cep.type = event.parent.id;
          }
          event.PROPERTIES = JSON.stringify(mergeDBProps(JSON.parse(event.PROPERTIES), JSON.parse(owner.dataValues.PROPERTIES)));
          return sequelize.Promise.all([
            EventDef.update(event, { where: { id: event.id }, transaction: t }),
            CEP.update(event.cep, { where: { event_id: event.id }, transaction: t }),
          ]);
        });
      }).then(function () {
        res.send({ success: true });
      });
    } else {
      console.error("Only owner can change his events");
      res.status(500).send(trans.authError);
    }
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });

});

router.post('/', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  if (usertype !== "admin") {
    let event = req.body.event;
    let id = null;
    sequelize.transaction(function (t) {
      return _createOrUpdateOutputDataInterface(event, t).then(function (result) {
        event.output = result.dataValues;
        _createEvent(event, 0);
        event.owner = username;
        return EventDef.create(event, { transaction: t }).then(function (data) {
          if (data.dataValues && data.dataValues.id) {
            event.cep.event_id = data.dataValues.id;
            id = data.dataValues.id;
            if (event.parent) {
              event.cep.type = event.parent.id;
            }
            return CEP.create(event.cep, { transaction: t });
          } else {
            return sequelize.Promise.reject();
          }
        });
      });
    }).then(function () {
      res.send({ success: true, id: id });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Admin user cannot change events");
    res.status(500).send(trans.authError);
  }
});

router.get('/findId/:id', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let searchOptionByUser = {
    id: req.params.id
  };
  if (usertype !== "admin") {
    searchOptionByUser = {
      id: req.params.id,
      owner: username
    };
  }
  EventDef.find({
    where: searchOptionByUser,
    include: {
      model: CEP
    }
  }).then(function (event) {
    res.send(event);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/all', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let searchOptionByUser = {};
  if (usertype !== "admin") {
    searchOptionByUser = {
      owner: username
    };
  }

  EventDef.findAll({
    include: {
      model: CEP
    },
    where: searchOptionByUser
  }).then(function (events) {
    res.send(events);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });

});

router.post('/search', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let item = req.body.searchItem;
  let rules = {
    where: {
      $and: []
    },
    include: {
      model: CEP,
      required: false,
      where: {
        $and: []
      }
    }
  };
  if (usertype !== "admin") {
    rules.where.$and.push({
      owner: username
    });
  }
  if (item.parent) {
    rules.include.where.$and.push({
      type: item.parent.id
    });
  }
  if (item.task) {
    rules.where.$and.push({
      diid: item.task.diid
    });
  }
  if (item.code) {
    rules.include.where.$and.push({
      code: {
        $like: "%" + item.code + "%"
      }
    });
  }
  if (item.name) {
    rules.where.$and.push({
      name: {
        $like: "%" + item.name + "%"
      }
    });
  }
  if (item.description) {
    rules.where.$and.push({
      description: {
        $like: "%" + item.description + "%"
      }
    });
  }
  EventDef.findAll(rules).then(function (events) {
    res.send(events);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});


router.get('/withdatainterfaceproperties/all/', function (req, res) {
  let username = req.query.username;
    let usertype = req.query.usertype;
    let searchOptionByUser = "";
    if (usertype !== "admin") {
        searchOptionByUser = ` where owner="${username}" `;
    }
    let sqlToFindAllEventsWithDataInterfaceProperty = `
    SELECT id, name, properties
    FROM STREAM_EVENT ${searchOptionByUser}
    `;
    sequelize.query(sqlToFindAllEventsWithDataInterfaceProperty, { type: sequelize.QueryTypes.SELECT })
        .then(allEventsWithDataInterfaceProperties => {
          res.status(200).send(allEventsWithDataInterfaceProperties);
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
      if (recordNeedUpdate.isAlarmConfigured && recordNeedUpdate.id) { // this record need bo be updated
          mergeProperties(recordNeedUpdate.parsedProperties.props, recordNeedUpdate.newAlarmConfigs);
          EventDef.update(
              { "PROPERTIES": JSON.stringify(recordNeedUpdate.parsedProperties) },
              { where: { id: recordNeedUpdate.id } }
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


module.exports = router;
