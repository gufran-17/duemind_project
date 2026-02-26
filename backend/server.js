const db = require("./models/db");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ROUTES IMPORT */
const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");

/* ROUTES USE */
app.use("/api/auth", authRoutes);
app.use("/api/reminders", reminderRoutes);

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.send("DueMind Backend Running ");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});