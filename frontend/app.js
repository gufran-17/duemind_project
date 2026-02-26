const API = "http://localhost:5000";
let currentFilter = "DUE_SOON";
const notifiedReminders = new Map(
  JSON.parse(localStorage.getItem("notifiedMap") || "[]")
);


/* Notification Permission */
if ("Notification" in window) {
  Notification.requestPermission();
}

/* Helper */
function showMessage(text, color = "red") {
  const el = document.getElementById("msg");
  if (!el) return;
  el.innerText = text;
  el.style.color = color;
}

/* Browser Notification */
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png"
    });
  }
}

/* Email Validator */
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/* REGISTER */
function register() {
  const name = document.getElementById("regName")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value;
  const confirm = document.getElementById("regConfirm")?.value;

  if (!name || !email || !password || !confirm) {
    showMessage("All fields required");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Invalid Email Format");
    return;
  }

  if (password !== confirm) {
    showMessage("Passwords do not match");
    return;
  }

  fetch(API + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  })
    .then(res => res.json())
    .then(data => {
      showMessage(data.message || "Registered Successfully", "green");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    });
}

/* LOGIN */
function login() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    showMessage("Enter email & password");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Invalid Email Format");
    return;
  }

  fetch(API + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.user) {
        showMessage("Wrong Email or Password");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    });
}


function loadReminders() {

  const user = JSON.parse(localStorage.getItem("user"));
  const output = document.getElementById("output");

  if (!user) {
    output.innerHTML = "User not logged in";
    return;
  }

  fetch(API + "/api/reminders/" + user.id)
    .then(res => res.json())
    .then(data => {

      const groups = data.data;
      const completed = [];

      Object.keys(groups).forEach(status => {
        groups[status] = groups[status].filter(reminder => {

          if (reminder.is_completed) {
            completed.push(reminder);
            return false;
          }

          return true;
        });
      });

      output.innerHTML = `
        <div class="tabs">
          <div class="tab overdue ${currentFilter === 'OVERDUE' ? 'active' : ''}" 
               onclick="setFilter('OVERDUE')">
            Overdue
          </div>

          <div class="tab duesoon ${currentFilter === 'DUE_SOON' ? 'active' : ''}" 
               onclick="setFilter('DUE_SOON')">
            Due Soon
          </div>

          <div class="tab upcoming ${currentFilter === 'UPCOMING' ? 'active' : ''}" 
               onclick="setFilter('UPCOMING')">
            Upcoming
          </div>

          <div class="tab completed ${currentFilter === 'COMPLETED' ? 'active' : ''}" 
               onclick="setFilter('COMPLETED')">
            Completed
          </div>
        </div>
      `;

      /* ⭐ COMPLETED VIEW */
      if (currentFilter === "COMPLETED") {

        if (completed.length === 0) {
          output.innerHTML += "<p>No completed reminders</p>";
        }

        completed.forEach(reminder => {
          output.innerHTML += `
            <div class="reminder-card completed">
              ✔ ${reminder.title}
            </div>
          `;
        });

        return;
      }

      const reminders = groups[currentFilter];

      if (!reminders || reminders.length === 0) {
        output.innerHTML += "<p>No reminders</p>";
        return;
      }

      reminders.forEach(reminder => {

        const datePart = reminder.due_date
          ? reminder.due_date.split(" ")[0]
          : "";

        const timePart = reminder.due_date
          ? reminder.due_date.split(" ")[1]?.substring(0, 5)
          : "";

        output.innerHTML += `
          <div class="reminder-card">

            <input id="title-${reminder.id}" 
                   value="${reminder.title}" 
                   disabled />

            <input id="category-${reminder.id}" 
                   value="${reminder.category}" 
                   disabled />

            <div class="date-time-row">
              <input id="date-${reminder.id}" 
                     type="date" 
                     value="${datePart}" 
                     disabled />

              <input id="time-${reminder.id}" 
                     type="time" 
                     value="${timePart}" 
                     disabled />
            </div>

            <div class="priority-row priority-${reminder.priority.toLowerCase()}">
              Priority: ${reminder.priority}
            </div>

            <div class="btn-row">
              <button onclick="enableEdit(${reminder.id})" class="edit-btn">
                Edit
              </button>

              <button onclick="updateReminder(${reminder.id})" class="save-btn">
                Save
              </button>

              <button onclick="snoozeReminder(${reminder.id})" class="edit-btn">
                Snooze
              </button>

              <button onclick="markCompleted(${reminder.id})" class="complete-btn">
                Complete
              </button>

              <button onclick="deleteReminder(${reminder.id})" class="delete-btn">
                Delete
              </button>
            </div>

          </div>
        `;
      });

    });
}

/* ENABLE EDIT */
function enableEdit(id) {
  ["title", "category", "date", "time"].forEach(field => {
    const el = document.getElementById(`${field}-${id}`);
    if (el) el.disabled = false;
  });
}

/* UPDATE REMINDER */
function updateReminder(id) {
  const titleEl = document.getElementById(`title-${id}`);
  const categoryEl = document.getElementById(`category-${id}`);
  const dateEl = document.getElementById(`date-${id}`);
  const timeEl = document.getElementById(`time-${id}`);

  const newTitle = titleEl.value;
  const newCategory = categoryEl.value;
  const newDate = dateEl.value;
  const newTime = timeEl.value;

  if (!newTitle || !newDate || !newTime) {
    showMessage("All fields required");
    return;
  }

  const due_date = `${newDate} ${newTime}:00`;

  fetch(API + "/api/reminders/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: newTitle,
      category: newCategory,
      due_date
    })
  })
    .then(res => res.json())
    .then(() => {
      showToast("Reminder Updated 😎");
      loadReminders();
    });
}

/* DELETE */
function deleteReminder(id) {
  fetch(API + "/api/reminders/" + id, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      showToast("Reminder Deleted");
      loadReminders();
    });
}

/* CREATE REMINDER */
function createReminder() {
  const user = JSON.parse(localStorage.getItem("user"));

  const title = document.getElementById("reminderTitle").value;
  const category = document.getElementById("reminderCategory").value;
  const date = document.getElementById("reminderDate").value;
  const time = document.getElementById("reminderTime").value;
  const priorityEl = document.getElementById("priority");
  const priority = priorityEl ? priorityEl.value : "LOW";

  if (!title || !date || !time) {
    showMessage("All fields required");
    return;
  }

  const due_date = `${date} ${time}:00`;

  fetch(API + "/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      title,
      category,
      due_date,
      priority: priority
    })
  })
    .then(res => res.json())
    .then(() => {
      showToast("Reminder Created");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    });
}

/* ✅ UPDATED BACKGROUND CHECKER – SAFE */

function saveNotifyState() {
  localStorage.setItem(
    "notifiedMap",
    JSON.stringify(Array.from(notifiedReminders.entries()))
  );
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

setInterval(() => {

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  fetch(API + "/api/reminders/" + user.id)
    .then(res => res.json())
    .then(res => {

      const now = new Date();

      const allReminders = [
        ...res.data.OVERDUE,
        ...res.data.DUE_SOON,
        ...res.data.UPCOMING
      ];

      allReminders.forEach(reminder => {

        if (!reminder.due_date) return;

        const due = new Date(reminder.due_date);
        const diff = due - now;

        const lastShown = notifiedReminders.get(reminder.id);

        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        /* ✅ 1 DAY BEFORE */
        if (isSameDay(due, tomorrow) && lastShown !== "1DAY") {

          showNotification(
            "Reminder Tomorrow 📅",
            `${reminder.title} is due tomorrow`
          );

          notifiedReminders.set(reminder.id, "1DAY");
          saveNotifyState();
        }

        /* ✅ SAME DAY MORNING */
        if (isSameDay(due, now) && now.getHours() < 12 && lastShown !== "MORNING") {

          showNotification(
            "Reminder Today ⏰",
            `${reminder.title} is due today`
          );

          notifiedReminders.set(reminder.id, "MORNING");
          saveNotifyState();
        }

        /* ✅ LAST 5 MINUTES */
        if (diff > 0 && diff < 300000) {

          if (!lastShown || Date.now() - lastShown > 60000) {

            showNotification(
              "Reminder Almost Due ⚠",
              `${reminder.title} in few minutes`
            );

            notifiedReminders.set(reminder.id, Date.now());
            saveNotifyState();
          }
        }

        /* ✅ EXACT TIME */
        if (diff < 0 && diff > -15000) {

          if (!lastShown || Date.now() - lastShown > 60000) {

            showNotification(
              "Reminder Due Now 🚀",
              `${reminder.title} is due NOW`
            );

            notifiedReminders.set(reminder.id, Date.now());
            saveNotifyState();
          }
        }

      });

    });

}, 5000);


/*   snoozeReminder */

function snoozeReminder(id) {

  const snoozeMinutes = 5;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  fetch(API + "/api/reminders/" + user.id)
    .then(res => res.json())
    .then(res => {

      const allReminders = [
        ...res.data.OVERDUE,
        ...res.data.DUE_SOON,
        ...res.data.UPCOMING
      ];

      const reminder = allReminders.find(r => r.id === id);
      if (!reminder || !reminder.due_date) return;

      /* ⭐ SAFE MANUAL PARSE */
      const [datePart, timePart] = reminder.due_date.split(" ");

      let [hours, minutes] = timePart.split(":").map(Number);

      minutes += snoozeMinutes;

      if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
      }

      if (hours >= 24) {
        hours = hours % 24;
      }

      const newDue =
        datePart + " " +
        String(hours).padStart(2, '0') + ":" +
        String(minutes).padStart(2, '0') + ":00";

      return fetch(API + "/api/reminders/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reminder.title,
          category: reminder.category,
          due_date: newDue
        })
      });

    })
    .then(() => {
      showToast("Reminder Snoozed ⏰");
      loadReminders();
    });
}

function markCompleted(id) {

  fetch(API + "/api/reminders/" + id + "/complete", {
    method: "PUT"
  })
    .then(res => res.json())
    .then(data => {

      showToast("Reminder Completed ✅");

      loadReminders(); // refresh UI
    });
}


/*  showtoast */
function showToast(message) {

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}


function setFilter(type) {
  currentFilter = type;
  loadReminders();
}