const db = require("../models/db");
const { classifyReminder } = require("../utils/dateUtils");

/* ✅ Production-safe priority normalizer */
const normalizePriority = (priority) => {
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];

  const upper = (priority || "").toUpperCase();

  return validPriorities.includes(upper) ? upper : "LOW";
};

const createReminder = (req, res) => {
  const { user_id, title, category, due_date, priority } = req.body;

  if (!user_id || !title || !due_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const finalPriority = normalizePriority(priority);

  const insertQuery =
    "INSERT INTO reminders (user_id, title, category, due_date, priority) VALUES (?, ?, ?, ?, ?)";

  db.query(
    insertQuery,
    [user_id, title, category, due_date, finalPriority],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Insert Failed", err });
      }

      res.json({
        message: "Reminder Created Successfully",
        reminderId: result.insertId,
      });
    }
  );
};

const getUserReminders = (req, res) => {
  const { userId } = req.params;

  const selectQuery = `
  SELECT * FROM reminders 
  WHERE user_id = ?
  ORDER BY 
    FIELD(priority, 'HIGH', 'MEDIUM', 'LOW'),
    due_date ASC
`;

  db.query(selectQuery, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Fetch Failed", err });
    }

    const grouped = {
      OVERDUE: [],
      DUE_SOON: [],
      UPCOMING: [],
    };

    result.forEach((reminder) => {
      const status = classifyReminder(reminder.due_date);

      grouped[status].push({
        ...reminder,
        status,
      });
    });

    res.json({
      message: "Dashboard Data",
      data: grouped,
    });
  });
};

const updateReminder = (req, res) => {
  const { id } = req.params;
  const { title, category, due_date, priority } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ message: "Title and due date required" });
  }

  const finalPriority = normalizePriority(priority);

  const updateQuery =
    "UPDATE reminders SET title = ?, category = ?, due_date = ?, priority = ? WHERE id = ?";

  db.query(
    updateQuery,
    [title, category, due_date, finalPriority, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Update Failed", err });
      }

      res.json({
        message: "Reminder Updated Successfully",
      });
    }
  );
};

const deleteReminder = (req, res) => {
  const { id } = req.params;

  const deleteQuery = "DELETE FROM reminders WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Delete Failed", err });
    }

    res.json({
      message: "Reminder Deleted Successfully",
    });
  });
};

const markCompleted = (req, res) => {
  const { id } = req.params;

  const updateQuery = "UPDATE reminders SET is_completed = 1 WHERE id = ?";

  db.query(updateQuery, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Completion Failed", err });
    }

    res.json({
      message: "Reminder marked as completed",
    });
  });
};

module.exports = {
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
  markCompleted,
};