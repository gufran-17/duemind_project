const db = require("../models/db");

/* REGISTER */
const registerUser = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const checkQuery = "SELECT * FROM users WHERE email = ?";

  db.query(checkQuery, [email], (err, result) => {
    if (result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const insertQuery =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(insertQuery, [name, email, password], (err, result) => {
      res.json({
        message: "User Registered Successfully"
      });
    });
  });
};

/* LOGIN */
const loginUser = (req, res) => {
  const { email, password } = req.body;

  const loginQuery =
    "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(loginQuery, [email, password], (err, result) => {
    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    res.json({
      message: "Login Successful",
      user: result[0]
    });
  });
};

/* FORGOT PASSWORD */
const forgotPassword = (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const checkQuery = "SELECT * FROM users WHERE email = ?";

  db.query(checkQuery, [email], (err, result) => {
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateQuery =
      "UPDATE users SET password = ? WHERE email = ?";

    db.query(updateQuery, [newPassword, email], (err, result) => {
      res.json({
        message: "Password Reset Successful"
      });
    });
  });
};

module.exports = { registerUser, loginUser, forgotPassword };