const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "gufran@2003",
  database: "duemind",

  timezone: "local",     // ⭐ CRITICAL FIX (stops minus-1 bug)
  dateStrings: true      // ⭐ MOST IMPORTANT (prevents JS date conversion)
});

connection.connect((err) => {
  if (err) {
    console.log("DB Connection Failed:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = connection;