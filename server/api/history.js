"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let History = require('../model/STREAM_HISTORY_CONFIG')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

let router = express.Router();

router.post('/event', function(req, res){
  let usertype = req.query.usertype;
  let username = req.query.username;
  if(usertype !== "admin") {
    let event = req.body.event;
    event.component_name = "event";
    event.user_name = username;
    event.id = event.config_data.id;
    event.config_data = JSON.stringify(event.config_data);
    History.create(event).then(function(){
      res.send({success: true});
    }).catch(function(err){
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    console.error("Non admin user cannot get this event");
    res.status(500).send(trans.authError);
  }
});

router.get('/:id', function(req, res){
  let usertype = req.query.usertype;
  let username = req.query.username;
  let event_id = req.params.id;
  if(usertype === "admin") {
    History.findAll({where : {id: event_id}, order: '`create_timestamp` DESC'}).then(function(events){
      res.send(events);
    }).catch(function(err){
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    History.findAll({where : {id: event_id, user_name: username}, order: '`create_timestamp` DESC'}).then(function(events){
      res.send(events);
    }).catch(function(err){
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }
});

module.exports = router;
