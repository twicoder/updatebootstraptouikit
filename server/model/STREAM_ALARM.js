/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_ALARM', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    alarm_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    alarm_content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    task_id: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    component_id: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_ALARM'
  });
};
