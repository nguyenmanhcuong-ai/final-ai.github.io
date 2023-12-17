const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'db.ghbroxwfwjkybspsuews.supabase.co',
  database: 'postgres',
  username: 'postgres',
  password: 'Cuong@0910@',
  dialectOptions: {
    port: 5432,
  },
});
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = sequelize;
