const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const jwt = require('jsonwebtoken');

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

const initializeAdminUser = async () => {
  try {
    // Check if the admin user already exists
    const adminUser = await Users.findOne({ where: { username: 'admin' } });

    if (!adminUser) {
      // If not, create the admin user
      const createdAdminUser = await Users.create({
        username: 'admin',
        password: 'admin',
        fullname: 'Nguyen Manh Cuong',
      });

      console.log('Admin user inserted successfully:', createdAdminUser.toJSON());
    } else {
      console.log('Admin user already exists:', adminUser.toJSON());
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
    throw new Error(`Error initializing admin user: ${error.message}`);
  }
};

const changeUserPassword = async (username, currentPassword, newPassword) => {
  try {
    let user;

    // Check if the username is in the 'users' table
    user = await Users.findOne({ where: { username } });

    // If not found in 'users' table, check 'employees' table
    if (!user) {
      user = await Employees.findOne({ where: { username } });
    }

    // If still not found, throw an error
    if (!user) {
      throw new Error('User not found');
    }

    console.log('Provided Current Password:', currentPassword);
    console.log('Database Current Password:', user.password);

    // Check the correctness of the current password
    const isPasswordValid = currentPassword === user.password;

    if (!isPasswordValid) {
      console.log('Password comparison failed');
      throw new Error('Invalid current password');
    }

    // Update the password based on the table
    if (user instanceof Users) {
      await Users.update({ password: newPassword }, { where: { username } });
    } else {
      await Employees.update({ password: newPassword }, { where: { username } });
    }

    // Retrieve the updated user information
    user = await user.reload();

    console.log('Password changed successfully');

    // Return the updated user information
    return user.toJSON();
  } catch (error) {
    console.error('Error changing password:', error);
    throw new Error(`Error changing password: ${error.message}`);
  }
};


const login = async (username, password) => {
  try {
    // Tìm nhân viên với username cung cấp
    let user = await Users.findOne({ where: { username } });

    // Nếu không tìm thấy trong bảng Users, thử tìm trong bảng Employees
    if (!user) {
      user = await Employees.findOne({ where: { username } });
    }

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // So sánh mật khẩu
    if (password !== user.password) {
      throw new Error('Invalid username or password');
    }

    return user.toJSON();
  } catch (error) {
    console.error('Error logging in:', error);
    throw new Error(`Error logging in: ${error.message}`);
  }
};

// accountService.js
const nodemailer = require('nodemailer');

const { v4: uuidv4 } = require('uuid');

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
    allowNull: true,
    unique: true,
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

const sendAccountCreationEmail = async (email, token) => {
  try {
    // Gửi email thông báo tạo tài khoản
    const info = await transporter.sendMail({
      from: 'minhph313@gmail.com',
      to: email,
      subject: 'Employee Account Created',
      html: `
      <p style="color: black; font-size: 20px;"><strong style="color: black;">Hi ${email.split('@')[0]},</strong></p>
      <p style="color: black; font-size: 20px;">Your employee account has been created <strong style="font-weight: bold; color: black;">successfully</strong>.</p>
      <p style="color: black; font-size: 20px;">Your account information:</p>
      <ul>
        <li style="color: black; font-size: 20px;">Username: <strong style="color: red;">${email.split('@')[0]}</strong></li>
        <li style="color: black; font-size: 20px;">Password: <strong style="color: red;">${email.split('@')[0]}</strong></li>
      </ul>
      <p style="color: black; font-size: 20px;">Please use the following link to log in:</p>
      <p style="color: black; font-size: 20px;">Login link: <a href="${token}" style="font-size: 18px;">${token}</a></p>
      <p style="color: black; font-size: 20px;"><em>Note: This link is valid for 10 seconds.</em></p>
      `,
    });

    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Error sending email: ${error.message}`);
  }
};



const createEmployeeAccount = async (fullname, email) => {
  try {
    const username = email.split('@')[0];
    const password = email.split('@')[0];
    const image = '/uploads/avatar1.png';
    const loginLink = "http://cuontiendat.online:3000";
    const newEmployee = await Employees.create({
      fullname,
      email,
      username,
      password,
      loginLink: loginLink,
      image,
      isFirstLogin: true,
      isLocked: false,
    });

    // Encode the token before sending it in the email

    // Use the encoded token in the email
    await sendAccountCreationEmail(email, loginLink);

    return newEmployee.toJSON();
  } catch (error) {
    console.error('Error creating employee account:', error);
    throw new Error(`Error creating employee account: ${error.message}`);
  }
};



// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'minhph313@gmail.com', // Your Gmail email address
    pass: 'cuoc xsau osdr gcrs',    // Use the App Password here
  }
});



const checkUserInTable = async (username, password, tableName) => {
  try {
    // Check if the user exists in the specified table
    const user = await sequelize.models[tableName].findOne({
      where: { username, password },
    });

    return user !== null; // Return true if the user exists in the table, otherwise false
  } catch (error) {
    console.error(`Error checking user in ${tableName}:`, error);
    throw new Error(`Error checking user in ${tableName}: ${error.message}`);
  }
};


const setFirstLoginStatus = async (username, isFirstLogin) => {
  try {
    const employee = await Employees.findOne({ where: { username } });

    if (!employee) {
      throw new Error('User not found');
    }

    // Cập nhật trạng thái isFirstLogin
    employee.isFirstLogin = isFirstLogin;
    await employee.save();

    console.log(`First login status updated for ${username}: ${isFirstLogin}`);

    return employee.toJSON();
  } catch (error) {
    console.error('Error updating first login status:', error);
    throw new Error(`Error updating first login status: ${error.message}`);
  }

};

// Example function to fetch user profile data
const fetchUserProfileData = async (username) => {
  try {
    // Use your Sequelize or database query to fetch user data from the 'users' table
    const userFromUsers = await Users.findOne({ where: { username } });

    // Use your Sequelize or database query to fetch user data from the 'employees' table
    const userFromEmployees = await Employees.findOne({ where: { username } });

    if (!userFromUsers && !userFromEmployees) {
      throw new Error('User not found');
    }

    // Prioritize data from the 'employees' table if available, otherwise use data from 'users'
    const fullName = (userFromEmployees && userFromEmployees.fullname) || (userFromUsers && userFromUsers.fullname);
    const imagePath = (userFromEmployees && userFromEmployees.image) || (userFromUsers && userFromUsers.image);

    if (!fullName) {
      throw new Error('Full name not found for the user');
    }

    return { fullName, imagePath };
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    throw new Error(`Error fetching user profile data: ${error.message}`);
  }
};

const updateUserAvatar = async (username, avatarBuffer) => {
  try {
    // Check if the user exists in the 'users' table
    let user = await Users.findOne({ where: { username } });

    // If not found in 'users' table, check 'employees' table
    if (!user) {
      user = await Employees.findOne({ where: { username } });
    }

    // If still not found, throw an error
    if (!user) {
      throw new Error('User not found');
    }

    // Convert the binary data to a Base64-encoded string
    const base64Avatar = avatarBuffer.toString('base64');

    // Update the avatar based on the table
    if (user instanceof Users) {
      await Users.update({ image: base64Avatar }, { where: { username } });
    } else {
      await Employees.update({ image: base64Avatar }, { where: { username } });
    }

    console.log('User avatar updated successfully');

    // Fetch the updated user data
    const updatedUser = await user.reload();

    return updatedUser.toJSON();
  } catch (error) {
    console.error('Error updating user avatar:', error);
    throw new Error(`Error updating user avatar: ${error.message}`);
  }
};
const getEmployeeList = async () => {
  try {
    // Fetch the list of employees from the 'employees' table
    const employeeList = await Employees.findAll({
      attributes: ['username', 'fullname', 'image', 'isFirstLogin', 'isLocked'],
    });

    // Convert Sequelize instances to plain JSON objects
    const employeesData = employeeList.map((employee) => employee.toJSON());

    return employeesData;
  } catch (error) {
    console.error('Error getting employee list:', error);
    throw new Error(`Error getting employee list: ${error.message}`);
  }
};

const getEmployeeDetails = async (username) => {
  try {
    // Fetch employee details based on the username
    const employee = await Employees.findOne({ where: { username } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Return the employee details
    return {
      fullname: employee.fullname,
      email: employee.email,
      username: employee.username,
      password: employee.password,
      avatar: employee.image, // Assuming image is the avatar field
    };
  } catch (error) {
    console.error('Error fetching employee details:', error);
    throw new Error(`Error fetching employee details: ${error.message}`);
  }
};
const lockEmployee = async (username, isLocked) => {
  try {
    // Find the employee in the 'employees' table
    const employee = await Employees.findOne({ where: { username } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Update the isLocked status
    employee.isLocked = true;
    await employee.save();

    console.log(`Employee ${username} ${isLocked ? 'locked' : 'unlocked'} successfully`);

    // Return the updated employee data
    return employee.toJSON();
  } catch (error) {
    console.error(`Error ${isLocked ? 'locking' : 'unlocking'} employee:`, error);
    throw new Error(`Error ${isLocked ? 'locking' : 'unlocking'} employee: ${error.message}`);
  }
};

const unlockEmployee = async (username) => {
  try {
    // Find the employee in the 'employees' table
    const employee = await Employees.findOne({ where: { username } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Update the isLocked status
    employee.isLocked = false;
    await employee.save();

    console.log(`Employee ${username} unlocked successfully`);

    // Return the updated employee data
    return employee.toJSON();
  } catch (error) {
    console.error(`Error unlocking employee:`, error);
    throw new Error(`Error unlocking employee: ${error.message}`);
  }
};



module.exports = {
  initializeAdminUser,
  login,
  changeUserPassword,
  createEmployeeAccount,
  checkUserInTable,
  setFirstLoginStatus,
  fetchUserProfileData,
  updateUserAvatar,
  getEmployeeList,
  getEmployeeDetails,
  lockEmployee,
  unlockEmployee,
  };
