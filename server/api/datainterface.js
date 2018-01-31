"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let DataInterface = require('../model/STREAM_DATAINTERFACE')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

let router = express.Router();

router.get('/', function(req, res){
  DataInterface.findAll().then(function (datainterface){
    res.send(datainterface);
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/exist/:name', function(req, res){
  DataInterface.find({where: {name: req.params.name}}).then(function (data) {
    if(data !== null && data !== undefined && data.dataValues !== undefined){
      res.send({name: req.params.name, find: true});
    }else{
      res.send({name: req.params.name, find: false});
    }
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/output', function(req, res){
  DataInterface.findAll({
    where:{
      type: 1
    }
  }).then(function (datainterface){
    res.send(datainterface);
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/:id', function(req, res){
  DataInterface.findAll({
    where:{
      id : req.params.id
    }
  }).then(function (datainterface){
    res.send(datainterface);
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

module.exports = router;
