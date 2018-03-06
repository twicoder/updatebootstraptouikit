"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let Prop = require('../model/STREAM_SYSTEMPROP')(sequelize, Sequelize);
let PropCategory = require('../model/STREAM_SYSTEMPROP_CATEGORY')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

let router = express.Router();
Prop.hasOne(PropCategory, { foreignKey: 'id' });

let isPropertyNameEndWithEnable = function(propertyName){
  let nameEndWithEnable = false;
  if(propertyName){
    let propertyParts = propertyName.split('.');
    if(propertyParts.length>0 && propertyParts[propertyParts.length-1].toLowerCase() === 'enable'){
      nameEndWithEnable = true;
    }
  }
  return nameEndWithEnable;
};

let changeEventPropertyValueFromtStringIntoBoolean = function (properties) {
  properties.forEach((oneProperty) => {
    if(isPropertyNameEndWithEnable(oneProperty.name)){
      if (oneProperty.value === "true") {
        oneProperty.value = true;
      } else {
        oneProperty.value = false;
      }
    }
  });
};

let changeEventPropertyValueFromBooleanIntoString = function (properties) {
  properties.forEach((oneProperty) => {
    if(isPropertyNameEndWithEnable(oneProperty.name)){
      if (oneProperty.value === true) {
        oneProperty.value = "true";
      } else {
        oneProperty.value = "false";
      }
    }
  });
};

router.get('/', function (req, res) {
  Prop.findAll({ where: { status: 1 } }).then(function (properties) {
    changeEventPropertyValueFromtStringIntoBoolean(properties);
    res.send(properties);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/all', function (req, res) {
  PropCategory.findAll().then(function (data) {
    let categorySet = new Set();
    if (data) {
      data.forEach((oneCategoryRecord) => {
        if (oneCategoryRecord.name) {
          categorySet.add(oneCategoryRecord.name);
        }
      });
    }
    Prop.findAll({
      include: [{
        model: PropCategory
      }]
    }).then(function (properties) {
      changeEventPropertyValueFromtStringIntoBoolean(properties);
      res.send({
        prop: properties,
        categorySet: Array.from(categorySet)
      });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });

  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/spark', function (req, res) {
  Prop.find({ attributes: ['id', 'value'], where: { name: 'SPARK_HOME' } }).then(function (properties) {
    res.send(properties);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/isalarmenabled', function (req, res) {
  // getAlarmEnableStatus(req,res);
  Prop.find({ attributes: ['value'], where: { name: 'ocsp.alarm.enable' } }).then(function (isAlarmEnabledData) {
    if (!isAlarmEnabledData) {
      res.status(200).send({ "enabled": "true" });
    } else {
      res.status(200).send({ "enabled": isAlarmEnabledData.dataValues.value });
    }
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});


router.get('/datasourcecount', function (req, res) {
  Prop.find({ attributes: ['value'], where: { name: 'ocsp.datasource.count' } }).then(function (properties) {
    if (!!!properties) {
      properties = {
        "value": "1"
      };
    }
    else if (parseInt(properties.dataValues.value) < 1) {
      properties = {
        "value": "1"
      };
    }
    else if (isNaN(properties.dataValues.value)) {
      properties = {
        "value": "1"
      };
    }
    res.send(properties);
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/spark', function (req, res) {
  let value = req.body.spark;
  sequelize.transaction(function (t) {
    return Prop.find({ where: { name: 'SPARK_HOME' } }).then(function (task) {
      if (task === null || task === undefined) {
        return Prop.create({ value: value, status: 1, name: "SPARK_HOME" }, { transaction: t });
      } else {
        let result = task.dataValues;
        result.value = value;
        return Prop.update(result, { where: { id: task.id }, transaction: t });
      }
    });
  }).then(function () {
    res.send({ success: true });
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.put('/', function (req, res) {
  let usertype = req.query.usertype;
  if (usertype === "admin") {
    let properties = req.body.data;
    let promises = [];
    changeEventPropertyValueFromBooleanIntoString(properties);
    for (let i in properties) {
      promises.push(Prop.update(properties[i], { where: { id: properties[i].id } }));
    }
    sequelize.Promise.all(promises).then(function () {
      res.send({ success: true });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Only admin user can change system properties");
    res.status(500).send(trans.authError);
  }
});

router.post('/', function (req, res) {
  let usertype = req.query.usertype;
  if (usertype === "admin") {
    let newProperty = req.body.newproperty;
    let promises = [];
    promises.push();
    Prop.create(newProperty).then(function (data) {
      let newlyCreatedProperty = data.dataValues;
      let newPropertyCategoryInfo = {
        id: newlyCreatedProperty.id,
        type: 2,
        name: 'userdefined'
      };
      PropCategory.create(newPropertyCategoryInfo).then(function () {
        res.send({ success: true });
      }).catch(function (err) {
        console.error(err);
        res.status(500).send(trans.databaseError);
      });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Only admin user can change system properties");
    res.status(500).send(trans.authError);
  }
});


router.delete('/:id', function (req, res) {
  let usertype = req.query.usertype;
  if (usertype === "admin") {
    let promises = [];
    promises.push(Prop.destroy({
      where: {
        id: req.params.id
      }
    }));
    promises.push(PropCategory.destroy({
      where: {
        id: req.params.id
      }
    }));
    sequelize.Promise.all(promises).then(function () {
      res.send({ success: true });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Only admin user can change system properties");
    res.status(500).send(trans.authError);
  }
});



module.exports = router;
