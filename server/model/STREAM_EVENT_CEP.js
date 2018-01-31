/* jshint indent: 2 */
"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('STREAM_EVENT_CEP', {
    event_id: {
      type: DataTypes.INTEGER(16),
      allowNull: false,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    monitor_fields: {
      type: DataTypes.STRING,
      allowNull: true
    },
    badge_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    create_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reserve_1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reserve_2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reserve_3: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reserve_4: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reserve_5: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    createdAt: false,
    updatedAt: false,
    tableName: 'STREAM_EVENT_CEP'
  });
};
