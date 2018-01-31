"use strict";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let Structure = require('../model/STREAM_TYPE_STRUCTURE')(sequelize, Sequelize);
let config = require('../config');
let trans = config[config.trans || 'zh'];

let router = express.Router();

function _findChild(id, sample){
  for(let i in sample){
    if(sample[i].dataValues.id === id){
      return sample[i].dataValues;
    }
  }
  return null;
}

function _dealWithStructure(node, sample){
  if(node.children_types){
    let types = JSON.parse(node.children_types);
    if(types.length > 0) {
      for (let i in types) {
        let child = _findChild(types[i], sample);
        if (child) {
          if (!node.children) {
            node.children = [];
          }
          let obj = {
            id: child.id,
            type: "type",
            expanded: true,
            label: child.type_name,
            children_types: child.children_types
          };
          node.children.push(obj);
          _dealWithStructure(obj, sample);
        }
      }
    }
  }
}

router.get('/', function(req, res){
  Structure.findAll().then((data) =>{
    let result = [];
    for(let i in data){
      if(!data[i].dataValues.parent_type) {
        let obj = {
          id: data[i].dataValues.id,
          type: "type",
          expanded: true,
          label: data[i].dataValues.type_name,
          children_types: data[i].dataValues.children_types
        };
        result.push(obj);
      }
    }
    for(let i in result){
      _dealWithStructure(result[i], data);
    }
    res.send(result);
  }).catch(function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.get('/all', function(req, res){
  Structure.findAll().then((data) => {
    res.send(data);
  }).catch( function(err){
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.post('/', function(req, res){
  let usertype = req.query.usertype;
  if(usertype === "admin") {
    let newType = req.body.newType;
    if (newType.parent) {
      newType.parent_type = newType.parent.id;
    }
    newType.children_types = "[]";
    sequelize.transaction(function (t) {
      return Structure.create(newType, {transaction: t}).then(function (data) {
        if (newType.parent && newType.parent.children_types) {
          newType.parent.children_types = JSON.parse(newType.parent.children_types);
          newType.parent.children_types.push(data.dataValues.id);
          newType.parent.children_types = JSON.stringify(newType.parent.children_types);
          return Structure.update(newType.parent, {where: {id: newType.parent.id}, transaction: t});
        }
      });
    }).then(function () {
      res.send({success: true});
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    console.error("Authenticate Failed, non admin user cannot use this router");
    res.status(500).send(trans.authError);
  }

});


router.delete('/:typeid', function(req, res){
  let usertype = req.query.usertype;
  if(usertype === "admin") {
    Structure.destroy({where: {id: req.params.typeid}}).then(function(){
      res.send({success:true});
    }).catch(function(err){
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }else{
    console.error("Authenticate Failed, non admin user cannot use this router");
    res.status(500).send(trans.authError);
  }

});


module.exports = router;
