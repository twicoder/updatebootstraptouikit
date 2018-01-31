/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_JOB', {
    id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    diid_fk: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      references: {
        model: 'STREAM_DATAINTERFACE',
        key: 'id'
      }
    },
    sys_fk: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'STREAM_SYSCONFIG',
        key: 'id'
      }
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stop_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    owner: {
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
    tableName: 'STREAM_JOB'
  });
};
