"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let Datasource = require('../model/STREAM_DATASOURCE')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

let router = express.Router();

router.get('/', function(req, res){
  Datasource.findAll({where: {status : {'$gt' : 0}}}).then(function (datasource){
    res.send(datasource);
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/', function (req, res) {
  let usertype = req.query.usertype;
  if(usertype === "admin") {
    let datasource = req.body.data;
    sequelize.transaction(function (t) {
      datasource.status = 2;//can be deleted
      if (datasource.type === 'kafka') {
        return Datasource.find({where: {id: 1}, transaction: t}).then(function (data) {
          datasource.properties = JSON.parse(data.properties);
          for (let i in datasource.properties) {
            if (datasource.properties[i].pname === 'zookeeper.connect') {
              datasource.properties[i].pvalue = datasource.zk;
            } else if (datasource.properties[i].pname === 'metadata.broker.list') {
              datasource.properties[i].pvalue = datasource.blist;
            }
          }
          datasource.properties = JSON.stringify(datasource.properties);
          return Datasource.create(datasource, {transaction: t});
        });
      } else if (datasource.type === 'codis') {
        return Datasource.find({where: {id: 2}, transaction: t}).then(function (data) {
          datasource.properties = JSON.parse(data.properties);
          for (let i in datasource.properties) {
            if (datasource.properties[i].pname === 'zk') {
              datasource.properties[i].pvalue = datasource.zk;
            } else if (datasource.properties[i].pname === 'zkpath') {
              datasource.properties[i].pvalue = datasource.zkpath;
            }
          }
          datasource.properties = JSON.stringify(datasource.properties);
          return Datasource.create(datasource, {transaction: t});
        });
      }
    }).then(function () {
      res.send({success: true});
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    console.error("Non admin user cannot change data sources");
    res.status(500).send(trans.authError);
  }
});

router.put('/', function (req, res) {
  let usertype = req.query.usertype;
  if(usertype === "admin") {
    let datasources = req.body.data;
    sequelize.transaction(function (t) {
      let promises = [];
      return Datasource.findAll({where: {status: 2}, transaction: t}).then(function () {
        for (let i in datasources) {
          promises.push(Datasource.update(datasources[i], {where: {id: datasources[i].id}, transaction: t}));
        }
        return sequelize.Promise.all(promises);
      });
    }).then(function () {
      res.send({success: true});
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    res.status(500).send(trans.authError);
  }
});

module.exports = router;
