/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_EVENT', {
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
    diid: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      references: {
        model: 'STREAM_DATAINTERFACE',
        key: 'id'
      }
    },
    select_expr: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    filter_expr: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    p_event_id: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    PROPERTIES: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_EVENT'
  });
};
