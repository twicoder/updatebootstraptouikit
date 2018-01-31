/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_DATAINTERFACE', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    dsid: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      references: {
        model: 'STREAM_DATASOURCE',
        key: 'id'
      }
    },
    filter_expr: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delim: {
    type: DataTypes.STRING,
      allowNull: false
  },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    properties: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_DATAINTERFACE'
  });
};
