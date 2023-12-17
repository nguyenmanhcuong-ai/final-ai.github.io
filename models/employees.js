// models/employees.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Đảm bảo rằng bạn đã cấu hình sequelize trong file config

const Employees = sequelize.define('employees', {
  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  loginLink: {
    type: DataTypes.STRING,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isFirstLogin: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false, // Đặt ở đây nếu bạn không muốn sử dụng createdAt và updatedAt
});

module.exports = Employees;
