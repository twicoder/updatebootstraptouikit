/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_ALARM_DEFINITION', {
    alarm_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_level: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_ChName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_EnName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alarm_component_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    alarm_properties: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_ALARM_DEFINITION'
  });
};
