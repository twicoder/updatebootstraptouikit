/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_LABEL', {
    id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    diid: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      references: {
        model: 'STREAM_DATAINTERFACE',
        key: 'id'
      }
    },
    p_label_id: {
      type: DataTypes.INTEGER(16),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: "0"
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    label_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_LABEL'
  });
};
