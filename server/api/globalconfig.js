"use strict";
let express = require('express');
let config = require('../config');
let router = express.Router();
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let trans = config[config.trans || 'zh'];
let Prop = require('../model/STREAM_SYSTEMPROP')(sequelize, Sequelize);

router.get('/links', function(req, res){
  res.send(config.quickLinks);
});

router.get('/cepEnable', function(req, res){
  Prop.find({where: {name : 'ocsp.event.cep.enable'}}).then((data)=>{
    if(data && data.dataValues){
      res.send(data.dataValues.value);
    }else{
      res.send(false);
    }
  }).catch((err)=>{
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/stormenabled', function(req, res){
  res.status(200).send({'stormenabled':config.storm_engine_supported || false});
});
module.exports = router;
