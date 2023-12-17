// config/pgConfig.js
const pgp = require('pg-promise')();

const connectionInfo = {
  user: 'postgres',
  host: 'db.ghbroxwfwjkybspsuews.supabase.co',
  database: 'postgres',
  password: 'Cuongai@0910@',
  port: 5432,
};

const db = pgp(connectionInfo);

module.exports = db;
