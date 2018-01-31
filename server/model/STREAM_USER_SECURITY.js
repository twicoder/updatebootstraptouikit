/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_USER_SECURITY', {
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
    spark_principal: {
      type: DataTypes.STRING,
      allowNull: true
    },
    spark_keytab: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kafka_principal: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kafka_keytab: {
      type: DataTypes.STRING,
      allowNull: true
    },
    kafka_jaas: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_USER_SECURITY'
  });
};
