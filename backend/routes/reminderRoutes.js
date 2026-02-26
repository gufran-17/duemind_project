const express = require("express");
const router = express.Router();

const {
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
  markCompleted
} = require("../controllers/reminderController");

router.post("/", createReminder);
router.get("/:userId", getUserReminders);
router.put("/:id", updateReminder);
router.put("/:id/complete", markCompleted);   // ⭐ NEW ROUTE
router.delete("/:id", deleteReminder);

module.exports = router;