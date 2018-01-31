/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_TYPE_STRUCTURE', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parent_type: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    children_types: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_TYPE_STRUCTURE'
  });
};
