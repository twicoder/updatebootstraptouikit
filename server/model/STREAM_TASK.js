/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_TASK', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    appID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    receive_interval: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "5"
    },
    num_executors: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "2"
    },
    driver_memory: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "2g"
    },
    executor_memory: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "2g"
    },
    executor_cores: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "2"
    },
    queue: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stop_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    retry: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    cur_retry: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    diid: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      references: {
        model: 'STREAM_DATAINTERFACE',
        key: 'id'
      }
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    heartbeat: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recover_mode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_TASK'
  });
};
