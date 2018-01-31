/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_EXCEPTION', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    taskID: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    appID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    exception_type: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    },
    exception_info: {
      type: DataTypes.STRING,
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    begin_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_EXCEPTION'
  });
};
