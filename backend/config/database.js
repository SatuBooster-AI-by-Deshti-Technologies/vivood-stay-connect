const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vivood_db',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('MySQL Connected');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
};

module.exports = { connectDB, getConnection };