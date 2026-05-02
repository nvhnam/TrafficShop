import createPool from "mysql2";
import { config as dotenvConfig } from "dotenv";
import mysql from "mysql2/promise";

dotenvConfig();

const dbPoolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
};

const dbPool = mysql.createPool(dbPoolConfig);

// Check database connection
// (async () => {
//   try {
//     const connection = await dbPool.getConnection(); // Get a connection from the pool
//     console.log("Database connected successfully!");

//     // const [rows] = await connection.query("SELECT * FROM product");

//     // console.log("Data from 'product' table:", rows);

//     connection.release(); // Release the connection back to the pool
//   } catch (err) {
//     console.error("Error connecting to the database:", err.message);
//     process.exit(1); // Exit the process if the connection fails
//   }
// })();

export { dbPool };
