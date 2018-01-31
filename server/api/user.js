"use strict";
import { jarPack, shiroConfig, trans, enableAuth } from "../config";
let express = require('express');
let sequelize = require('../sequelize');
let Sequelize = require('sequelize');
let User = require('../model/STREAM_USER')(sequelize, Sequelize);
let User_SECURITY = require('../model/STREAM_USER_SECURITY')(sequelize, Sequelize);
let exec = require('child_process').exec;
let router = express.Router();
let path = require('path');
let fs = require('fs');

const prefix = "./server/lib/";

router.post('/login', function (req, res) {
  let username = req.body.username;
  let pass = req.body.password;
  exec(`java -Dconfig=${prefix}${shiroConfig} -Dtype=encrypt -Dusername=${username} -Dpassword=${pass} -jar ${prefix}${jarPack}`,
    (error, token) => {
      if (error === null) {
        token = token.trim();
        if (enableAuth) {
          exec(`LC_ALL=en java -Dconfig=${prefix}${shiroConfig} -Dtype=decrypt -Dtoken=${token} -jar ${prefix}${jarPack}`,
            (err, message) => {
              if (err === null) {
                if (message.includes("Failed")) {
                  console.error("Authenticate Failed, shiro failed");
                  res.send({ status: false });
                } else {
                  res.send({ status: true, token });
                }
              } else {
                console.error(err);
                res.status(500).send('Token校验错误，请重新登陆！');
              }
            });
        } else {
          console.error("Authenticate shiro is disabled");
          res.send({ status: true, token });
        }
      } else {
        console.error(error);
        res.status(500).send('生成Token错误，请检查系统配置！');
      }
    });
});

router.get('/', function (req, res) {
  let usertype = req.query.usertype;
  if (usertype === "admin") {
    User.findAll({ attributes: ['id', 'name', 'description'] }).then(function (users) {
      res.send(users);
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Authenticate Failed, non admin user cannot use this router");
    res.status(500).send(trans.authError);
  }
});

router.get('/:userName', function (req, res) {
  let userAttrs = ['id', 'name', 'spark_principal', 'spark_keytab', 'kafka_principal', 'kafka_keytab', 'kafka_jaas'];
  let userInfo = {
    isDBUser: false,
    spark_principal: '',
    spark_keytab: '',
    kafka_principal: '',
    kafka_keytab: '',
    kafka_jaas: ''
  };
  User.findOne({
    where: { name: req.params.userName },
    attributes: ['id', 'name']
  }
  ).then(function (user) {
    if (user !== null) {
      userInfo.isDBUser = true;
    } else {
      userInfo.isDBUser = false;
    }
    User_SECURITY.findOne({
      where: { name: req.params.userName },
      attributes: userAttrs
    }).then(function (user) {
      if (user !== null) {
        user.dataValues.isDBUser = false;
        userInfo.spark_principal = user.spark_principal;
        userInfo.spark_keytab = user.spark_keytab;
        userInfo.kafka_principal = user.kafka_principal;
        userInfo.kafka_keytab = user.kafka_keytab;
        userInfo.kafka_jaas = user.kafka_jaas;
      }
      res.send(userInfo);
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });
});

router.put('/:userName', function (req, res) {
  let user = req.body.user;
  let updateUserInfo = function (UserModel) {
    UserModel.update(user, { where: { name: req.params.userName } })
      .then(function () {
        res.send({ status: true });
      }, function () {
        res.send({ status: false });
      });
  };
  User_SECURITY.findOne({
    where: { name: user.name },
  }).then(function (queriedUser) {
    if (queriedUser !== null) {
      updateUserInfo(User_SECURITY);
    } else {
      User_SECURITY.create(user).then(function () {
        res.send({ status: true });
      }).catch(function (err) {
        console.error(err);
        res.status(500).send(trans.databaseError);
      });
    }
  }).catch(function (err) {
    console.error(err);
    res.status(500).send(trans.databaseError);
  });

});

router.put('/', function (req, res) {
  let users = req.body.users;
  let usertype = req.query.usertype;
  let _parsePassword = function (promises, i) {
    promises.push(new sequelize.Promise((resolve, reject) => {
      let user = users[i];
      if (user.password !== undefined && user.password !== null) {
        exec(`LC_ALL=en java -Dtype=sha-256 -Dusername=${user.name} -Dpassword=${user.password} -jar ${prefix}${jarPack}`,
          (error, password) => {
            if (error === null) {
              user.password = password.trim();
              if (users[i].id !== undefined && users.id !== null) {
                promises.push(User.update(users[i], { where: { id: users[i].id } }));
              } else {
                promises.push(User.create(users[i]));
              }
              resolve();
            } else {
              console.error(error);
              reject(trans.authError);
            }
          });
      } else {
        resolve();
      }
    }));
  };
  if (usertype === "admin") {
    User.findAll().then((dbUsers) => {
      let promises = [];
      for (let i in users) {
        _parsePassword(promises, i);
      }
      for (let i in dbUsers) {
        let flag = true;
        for (let j in users) {
          if (dbUsers[i].dataValues.id === users[j].id) {
            flag = false;
            break;
          }
        }
        if (flag) {
          promises.push(User.destroy({ where: { id: dbUsers[i].dataValues.id } }));
        }
      }
      return sequelize.Promise.all(promises).then(function () {
        res.send({ success: true });
      });
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Authenticate Failed, non admin user cannot use this router");
    res.status(500).send(trans.authError);
  }
});

router.post('/change', function (req, res) {
  let username = req.query.username;
  let usertype = req.query.usertype;
  let user = req.body.user;
  if (username === user.name || usertype === "admin") {
    User.find({ where: { name: user.name } }).then(function (data) {
      if (data !== null && data !== undefined && data.dataValues !== undefined) {
        exec(`LC_ALL=en java -Dtype=sha-256 -Dusername=${user.name} -Dpassword=${user.password} -jar ${prefix}${jarPack}`,
          (error, password) => {
            if (error === null) {
              user.password = password.trim();
              User.update(user, { where: { id: data.dataValues.id } }).then(function () {
                res.send({ status: true });
              }, function () {
                res.send({ status: false });
              });
            } else {
              console.error(error);
              res.status(500).send(trans.authError);
            }
          });
      } else {
        console.error(`Find user error, username ${user.name}`);
        res.send({ status: false });
      }
    }).catch(function (err) {
      console.error(err);
      res.status(500).send(trans.databaseError);
    });
  } else {
    console.error("Authenticate Failed, non admin user cannot use this router");
    res.status(500).send(trans.authError);
  }
});

router.post('/checkfiles', function (req, res) {
  let filesNeedCheck = req.body.filesNeedCheck;
  let kafkaConfigFile = path.join(__dirname, "../../../conf/", filesNeedCheck.files.kafkaconfigfile);
  let sparkConfigFile = path.join(__dirname, "../../../conf/", filesNeedCheck.files.sparkconfigfile);
  let ocsp_kafka_jaasFile = "";

  if (!!filesNeedCheck.files.ocsp_kafka_jaas) {
    ocsp_kafka_jaasFile = path.join(__dirname, "../../../conf/", filesNeedCheck.files.ocsp_kafka_jaas);
  }

  let checkResult = {
    kafkaconfigfileexist: false,
    sparkconfigfileexist: false,
    ocsp_kafka_jaasexist: false
  };
  fs.access(kafkaConfigFile, fs.constants.R_OK, (err) => {
    if (!err) {
      checkResult.kafkaconfigfileexist = true;
    }
    fs.access(sparkConfigFile, fs.constants.R_OK, (err) => {
      if (!err) {
        checkResult.sparkconfigfileexist = true;
      }
      if (!!filesNeedCheck.files.ocsp_kafka_jaas) {
        fs.access(ocsp_kafka_jaasFile, fs.constants.R_OK, (err) => {
          if (!err) {
            checkResult.ocsp_kafka_jaasexist = true;
          }
          res.send(checkResult);
        });
      } else {
        res.send(checkResult);
      }

    });
  });
});

module.exports = router;
