const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Customers = sequelize.define('customers', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  usernameCus: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordCus: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false,
});


// Hàm kiểm tra xem khách hàng đã tồn tại hay chưa
const isCustomerExist = async (phoneNumber) => {
  const customer = await Customers.findOne({
    where: { phone: phoneNumber },
  });
  return !!customer;
};

const getCustomerByPhoneNumber = async (phoneNumber) => {
  const customer = await Customers.findOne({
    where: { phone: phoneNumber },
  });

  return customer ? customer.toJSON() : null;
};

const addCustomer = async (name, phoneNumber, address, usernameCus, passwordCus) => {
  const newCustomer = await Customers.create({
    name,
    phone: phoneNumber,
    address,
    usernameCus: phoneNumber,
    passwordCus: phoneNumber,
  });

  return newCustomer.toJSON();
};

function createInvoiceDetails(customerName, phoneNumber, products) {
  // Generate HTML for the invoice details
  const invoiceDetailsHTML = `
    <h3>Invoice Details</h3>
    <p>Customer: ${customerName}</p>
    <p>Phone Number: ${phoneNumber}</p>
    <table>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total Price</th>
      </tr>
      ${generateProductRows(products)}
    </table>
  `;

  return invoiceDetailsHTML;
}

function generateProductRows(products) {
  if (!Array.isArray(products)) {
    // Handle the case when products is not an array
    return '';
  }

  // Continue with the map function
  return products.map(/* ... */).join('');
}

module.exports = { isCustomerExist, addCustomer, getCustomerByPhoneNumber, createInvoiceDetails };
