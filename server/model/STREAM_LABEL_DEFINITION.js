/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_LABEL_DEFINITION', {
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
    class_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    properties: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_LABEL_DEFINITION'
  });
};
