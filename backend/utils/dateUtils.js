const classifyReminder = (dueDate) => {

  if (!dueDate) return "UPCOMING";   // crash stopper

  const now = new Date();
  const due = new Date(dueDate);

  const diffMs = due - now;

  /* ✅ TIME PASSED = OVERDUE */
  if (diffMs < 0) return "OVERDUE";

  const diffHours = diffMs / (1000 * 60 * 60);

  /* ✅ WITHIN 72 HOURS = DUE SOON */
  if (diffHours <= 72) return "DUE_SOON";

  return "UPCOMING";
};

module.exports = { classifyReminder };