/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_SYSCONFIG', {
    id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    config: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_SYSCONFIG'
  });
};
