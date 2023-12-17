// models/employees.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Đảm bảo rằng bạn đã cấu hình sequelize trong file config

const Users = sequelize.define('users', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false,
});

module.exports = Users;
