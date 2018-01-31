"use strict";
// sequelize config
let Sequelize = require('sequelize');
let config = require('./config');
let env = config.env || 'dev';
let sequelize = new Sequelize(config[env].mysql, {
  logging: false
});

// let sequelize = new Sequelize('ocsp3', 'root', 'Root@123', {
//   host:'10.1.236.130',
//   logging: false
// });
module.exports = sequelize;
