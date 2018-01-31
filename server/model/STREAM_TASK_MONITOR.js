/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_TASK_MONITOR', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    reserved_records: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    dropped_records: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    archived: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    application_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    batch_running_time_ms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    max_storage_memory: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    used_storage_memory: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    remaining_storage_memory: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_TASK_MONITOR'
  });
};
