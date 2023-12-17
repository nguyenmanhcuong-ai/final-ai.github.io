const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const accountService = require('./services/accountService');
const multer = require('multer');
const { Employees } = require('./models/employees'); // Đảm bảo rằng bạn đã định nghĩa model Employees
const sequelize = require('./config/sequelize');
const productService = require('./services/productService'); // Thay đổi đường dẫn tương ứng
const customerService = require('./services/customerService'); // Thay đổi đường dẫn tương ứng

const { Users } = require('./models/users'); // Đảm bảo rằng bạn đã định nghĩa model Employees

const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
// Serve static files from the 'public' directory
app.use(express.static('public'));

app.set('view engine', 'ejs');
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.use(flash());
const storage = multer.memoryStorage(); // You can choose a different storage strategy
const upload = multer({ storage: storage });

// Connect to Supabase
accountService.initializeAdminUser();

// Routes
const requireLogin = (req, res, next) => {
  // Kiểm tra xem người dùng đã đăng nhập hay chưa
  if (req.isAuthenticated()) {
    // Nếu đã đăng nhập, tiếp tục xử lý
    return next();
  }

  // Nếu chưa đăng nhập, kiểm tra xem đã đăng nhập lần đầu hay chưa
  const loggedInUsername = req.session.loggedInUsername;

  if (loggedInUsername) {
    // Nếu đã đăng nhập lần đầu, tiếp tục xử lý
    return next();
  }

  // Nếu chưa đăng nhập lần đầu, chuyển hướng đến trang login
  res.redirect('/');
};


app.use('/addProduct', requireLogin);
app.use('/manageCategories', requireLogin);

// Sử dụng thư viện cors
const cors = require('cors');

// Khi sử dụng CORS middleware
app.use(cors());
app.use(cors({
  origin: 'http://cuontiendat.online:3000',
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.get('/', (req, res) => {
  // Render the login page using your EJS template
  res.render('login', { message: req.flash('message') });
});

app.get('/dashboardEmployee', (req, res) => {
  // Xử lý logic và render trang dashboardEmployee
  res.render('dashboardEmployee');
});
  
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user is in the 'users' table
    const userInUsersTable = await accountService.checkUserInTable(username, password, 'users');
    
    if (userInUsersTable) {
      req.session.loggedInUsername = username;

      // Fetch the user role and store it in the session
      const user = await accountService.login(username, password);
      req.session.loggedInUserRole = username;

      console.log('Logged In Username:', username);
      console.log('Logged In User Role:', req.session.loggedInUserRole);

      res.redirect('/dashboard');
      return;
    }
    // Check if the user is in the 'employees' table
    const employee = await accountService.login(username, password);

    req.session.loggedInUsername = username;
    req.session.loggedInUserRole = employee.role;

    console.log('Logged In Username:', username);
    console.log('Logged In User Role:', req.session.loggedInUserRole);

    // Check isFirstLogin
    if (employee.isFirstLogin) {
      // Render the first login page
      return res.render('firstLogin', { employee });
    }

    // Check if the employee account is locked
    if (employee.isLocked) {
      // Render a page with a message indicating that the account is locked
      return res.render('accountLocked', { employee });
    }

    // Redirect to the employee dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during login:', error);
    res.render('login', { message: 'Username or password is wrong' });
  }
});

app.post('/changepassword', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Retrieve the logged-in username from the session
    const loggedInUsername = req.session.loggedInUsername;

    if (!loggedInUsername) {
      return res.status(400).json({ success: false, message: 'User not logged in' });
    }

    // Check if the user is valid and determine the table
    const isUserInUsersTable = await accountService.checkUserInTable(loggedInUsername, currentPassword, 'users');
    const isUserInEmployeesTable = await accountService.checkUserInTable(loggedInUsername, currentPassword, 'employees');

    let tableName;
    if (isUserInUsersTable) {
      tableName = 'users';
    } else if (isUserInEmployeesTable) {
      tableName = 'employees';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid current password' });
    }

    // Update the password in the corresponding table
    await accountService.changeUserPassword(loggedInUsername, currentPassword, newPassword, tableName);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during password change:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/changepasswordemployee', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Retrieve the logged-in username from the session
    const loggedInUsername = req.session.loggedInUsername;

    if (!loggedInUsername) {
      return res.status(400).json({ success: false, message: 'User not logged in' });
    }

    // Check if the user is valid and update the password
    const isUserValid = await accountService.checkUserInTable(loggedInUsername, currentPassword, 'employees');

    if (isUserValid) {
      await accountService.changeUserPassword(loggedInUsername, currentPassword, newPassword);
      await accountService.setFirstLoginStatus(loggedInUsername, false);
      res.redirect('/dashboard');
    } else {
      res.status(400).json({ success: false, message: 'Invalid current password' });
    }

  } catch (error) {
    console.error('Error during employee password change:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Assuming you have a route to render the dashboard page, and you pass the user data to it

app.get('/dashboard', (req, res) => {
  // Retrieve user data from your authentication mechanism (e.g., passport, session)
  const loggedInUserRole = req.session.loggedInUserRole;
  if (req.session.loggedInUsername) {
    res.render('dashboard', { loggedInUsername: req.session.loggedInUsername, loggedInUserRole });
} else {
    // Nếu không có người dùng đăng nhập, có thể chuyển hướng hoặc xử lý theo cách khác
    res.redirect('/');
}

  // Render the dashboard page and pass the user role
});

app.get('/createEmployeeAccount', (req, res) => {
  const message = req.query.message || '';
  res.render('createEmployeeAccount', { message });
});

app.post('/createEmployeeAccount', async (req, res) => {
  const { fullName, email } = req.body;

  try {
    const newUser = await accountService.createEmployeeAccount(fullName, email);

    // Thay đổi ở đây: Trả về trang HTML thay vì JSON
    res.render('createEmployeeAccount', { message: 'Employee account created successfully', user: newUser });
  } catch (error) {
    // Thay đổi ở đây: Trả về trang HTML thay vì JSON
    res.render('createEmployeeAccount', { message: 'Error creating employee account', error: error.message });
  }
});

app.post('/logout', (req, res) => {
    // Perform logout actions here
    // For example, destroy the session if you're using sessions
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        // Redirect to the login page after logout
        res.redirect('/');
    });
});


app.get('/profile', async (req, res) => {
  try {
    // Fetch user profile data based on the logged-in user
    const loggedInUsername = req.session.loggedInUsername;
    const userProfileData = await accountService.fetchUserProfileData(loggedInUsername);

    // Render the profile page with updated user data
    res.render('profile', { userProfileData });
  } catch (error) {
    console.error('Error fetching or rendering user profile data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


app.post('/changeavatar', upload.single('avatar'), async (req, res) => {
  try {
    // Process the avatar change and get the new image path
    const loggedInUsername = req.session.loggedInUsername;
    if (!loggedInUsername) {
      return res.status(400).json({ success: false, message: 'User not logged in' });
    }

    await accountService.updateUserAvatar(loggedInUsername, req.file.buffer);

    // Redirect to /profile after successfully changing the avatar
    res.redirect('/profile');
  } catch (error) {
    console.error('Error during avatar change:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/employeeList', async (req, res) => {
  try {
    // Get the list of employees using the correct function from accountService
    const employees = await accountService.getEmployeeList();

    // Render the employeeList page and pass the list of employees to the template
    res.render('employeeList', { employees });
  } catch (error) {
    console.error('Error fetching employee list:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/employeeDetails', async (req, res) => {
  try {
    const username = req.query.username;
    
    // Fetch the employee details based on the username
    const employeeDetails = await accountService.getEmployeeDetails(username);

    // Render the employeeDetails.ejs page with the employee details
    res.render('employeeDetails', { employeeDetails });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/lockEmployee', async (req, res) => {
  const { username } = req.body;
  try {
    const lockedEmployee = await accountService.lockEmployee(username);
    res.json({ success: true, message: `Employee ${username} locked successfully` });
  } catch (error) {
    console.error('Error locking account:', error);
    res.json({ success: false, message: `Error locking account: ${error.message}` });
  }
});
app.post('/unlockEmployee', async (req, res) => {
  try {
    const { username } = req.body;

    // Call the unlockEmployee function from the account service
    const unlockedEmployee = await accountService.unlockEmployee(username);

    // Respond with a success message
    res.json({ success: true, message: `Employee ${username} unlocked successfully` });
  } catch (error) {
    // Handle errors and respond with an error message
    console.error('Error unlocking account:', error);
    res.json({ success: false, message: `Error unlocking account: ${error.message}` });
  }
});


app.get('/salesInfo', (req, res) => {
  // Lấy thông tin từ req.query.username
  const username = req.query.username;
  // Render trang salesInfo.ejs với thông tin của nhân viên
  res.render('salesInfo', { username });
});



app.get('/manageCategories', async (req, res) => {
  const loggedInUsername = req.session.loggedInUsername;

  try {
    const products = await productService.getProductsForCatalog();

    // Lấy thông tin người dùng từ res.locals
    const user = loggedInUsername;

    // Kiểm tra xem có thông tin người dùng và username không
    if (user) {
      const username = user;
      console.log('Username:', username);

      // Log the products, userRole, and username to the console for debugging
      console.log('Products:', products);

      // Render the 'manageCategories' template and pass the variables
      res.render('manageCategories', { products, username });
    } else {
      console.log('Username not available');
      // Handle the case where the username is not available
      res.status(401).send('Unauthorized');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Trong file route hoặc controller
app.get('/addProduct', (req, res) => {
  // Xử lý logic nếu cần
  // Truyền message khi render trang
  res.render('addProduct');
});

app.post('/saveProduct', async (req, res) => {
  const { name, priceSale, type, dateCreate, priceImport, description, qrCode, image } = req.body;

  try {
      const newProduct = await productService.saveProduct({
          name,
          priceSale,
          type,
          dateCreate,
          priceImport,
          description,
          qrCode,
          image,
      });
  
      res.redirect(`/addProduct?message=Product added successfully&product=${JSON.stringify(newProduct)}`);
  } catch (error) {
      res.redirect(`/addProduct?message=Error adding product&error=${error.message}`);
  }
  
});


app.get('/editProduct/:productId', async (req, res) => {
  const productId = req.params.productId;

  // Retrieve the product details based on the productId
  const result = await productService.getProductById(productId);

  if (result.success) {
    // Render the 'editProduct' view and pass the product data
    res.render('editProduct', { product: result.data });
  } else {
    // Handle the case where the product is not found
    res.status(result.error === 'Product not found' ? 404 : 500).send(result.error);
  }
});


app.put('/updateProduct/:productId', async (req, res) => {
  const productId = req.params.productId;
  const updatedProductData = req.body;
console.log(productId)
  try {
      const result = await productService.updateProduct(productId, updatedProductData);

      if (result.success) {
          res.status(200).json({ success: true, message: 'Product updated successfully' });
      } else {
          res.status(500).json({ success: false, error: 'Failed to update product' });
      }
  } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/checkIsBought/:productId', async (req, res) => {
  try {
      const productId = req.params.productId;

      // Call the checkIsBoughtStatus function from the productService
      const result = await productService.checkIsBoughtStatus(productId);

      if (result.success) {
          res.json({ success: true, isBought: result.isBought });
      } else {
          res.status(result.error === 'Product not found' ? 404 : 500).json({ success: false, error: result.error });
      }
  } catch (error) {
      console.error('Error checking isBought status:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Route to delete product
app.delete('/deleteProduct/:productId', async (req, res) => {
  try {
      const productId = req.params.productId;

      // Call the deleteProduct function from the productService
      const result = await productService.deleteProduct(productId);

      if (result.success) {
          res.json({ success: true, message: 'Product deleted successfully' });
      } else {
          res.status(result.error === 'Product not found' ? 404 : 500).json({ success: false, error: result.error });
      }
  } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});




app.get('/transactionProcessing', (req, res) => {
  res.render('transactionProcessing'); // Render the EJS file for Transaction Processing
});

app.post('/confirmPayment', async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const customerName = req.body.customerName;
  const customerAddress = req.body.customerAddress;
  const customerPayment = req.body.customerPayment;
  const usernameCus = req.body.phoneNumber;
  const passwordCus = req.body.phoneNumber;

  try {
    // Check if the customer already exists in Sequelize
    const existingCustomer = await customerService.getCustomerByPhoneNumber(phoneNumber);

    // If the customer doesn't exist, create a new customer in Sequelize
    if (!existingCustomer) {
      const newCustomer = await customerService.addCustomer(
        customerName,
        phoneNumber,
        customerAddress,
        usernameCus, // Implement your own logic
        passwordCus // Implement your own logic
      );

      console.log('New customer added:', newCustomer);
    }

    // Continue with the rest of your payment confirmation logic
    // ...

    // Create the invoice details
    const invoiceDetails = customerService.createInvoiceDetails(customerName, phoneNumber, /* Add more details as needed */);

    // Log the invoice details for debugging
    console.log('Invoice Details:', invoiceDetails);

    // Send the invoice details back to the client
    res.status(200).json({ success: true, message: 'Payment confirmed!', invoiceDetails });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
