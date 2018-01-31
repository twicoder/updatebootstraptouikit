"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let SysConfig = require('../model/STREAM_SYSCONFIG')(sequelize, Sequelize);
// let randomstring = require("randomstring");
let config = require('../config');
let trans = config[config.trans || 'zh'];
let router = express.Router();
// let request = require('request');
// const fs = require('fs');


router.get('/:id', function (req, res) {
    // let username = req.query.username;
    // let usertype = req.query.usertype;
    return SysConfig.find({ where: { id: req.params.id }}).then(function(oneSysConfig){
      res.send(oneSysConfig);
    }).catch(function(err){
      console.log(err);
      res.status(500).send(trans.databaseError);
    }); 

});

module.exports = router;