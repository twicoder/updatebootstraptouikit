/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_EVENT_MONITOR', {
    event_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true
    },
    event_records: {
      type: DataTypes.STRING,
      allowNull: false
    },
    task_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_EVENT_MONITOR'
  });
};
