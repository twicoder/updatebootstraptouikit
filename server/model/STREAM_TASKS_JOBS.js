/* jshint indent: 2 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('STREAM_TASKS_JOBS', {
        id: {
            type: DataTypes.INTEGER(16),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        stream_taskid: {
            type: DataTypes.INTEGER(16),
            allowNull: true
        },
        stream_jobid: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            createdAt: false,
            updatedAt: false,
            tableName: 'STREAM_TASKS_JOBS'
        });
};
