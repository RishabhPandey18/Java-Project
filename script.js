


const $ = (id) => document.getElementById(id);

const STORAGE = {
    user: "chronotask_user",
    tasks: "chronotask_tasks",
    activity: "chronotask_activity"
};

let tasks = [];
let activity = [];
let currentUser = null;
let toastTimer;


function loadData() {
    try {
        tasks = JSON.parse(localStorage.getItem(STORAGE.tasks)) || [];
        activity = JSON.parse(localStorage.getItem(STORAGE.activity)) || [];

        if (!Array.isArray(tasks)) tasks = [];
        if (!Array.isArray(activity)) activity = [];

        currentUser = JSON.parse(localStorage.getItem(STORAGE.user));
    } catch (error) {
        console.error("Could not load saved data:", error);

        tasks = [];
        activity = [];
        currentUser = null;
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
}

function saveActivity() {
    localStorage.setItem(STORAGE.activity, JSON.stringify(activity));
}



function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}




function logActivity(message, icon = "✓") {
    activity.unshift({
        id: Date.now() + Math.random(),
        message,
        icon,
        time: new Date().toISOString()
    });

    // Keep the most recent 100 records.
    activity = activity.slice(0, 100);

    saveActivity();
    renderActivity();
}



function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "Unknown time";

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
    });
}

function dueLabel(dateString) {
    if (!dateString) return "No due date";

    const today = localDateString();

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = localDateString(tomorrowDate);

    if (dateString < today) return "Overdue";
    if (dateString === today) return "Due today";
    if (dateString === tomorrow) return "Due tomorrow";

    return formatDate(dateString);
}


$("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;

    if (!email || !password) {
        showToast("Please enter your email and password.");
        return;
    }

    if (password.length < 4) {
        showToast("Password must contain at least 4 characters.");
        return;
    }

 

    currentUser = {
        email: email,
        name: email.split("@")[0]
    };

    localStorage.setItem(STORAGE.user, JSON.stringify(currentUser));

    logActivity("Logged into the workspace", "↪");

    openApp();
});


function openApp() {
    if (!currentUser) return;

    $("loginPage").classList.add("hidden");
    $("app").classList.remove("hidden");

    updateUserInterface();
    showPage("dashboard");

    renderAll();
}


function logout() {
    if (!confirm("Are you sure you want to log out?")) return;

    logActivity("Logged out of the workspace", "↪");

    localStorage.removeItem(STORAGE.user);
    currentUser = null;

    $("app").classList.add("hidden");
    $("loginPage").classList.remove("hidden");

    $("loginPassword").value = "";

    showToast("You have logged out.");
}


$("logoutBtn").addEventListener("click", logout);




function updateUserInterface() {
    if (!currentUser) return;

    const name = currentUser.name || currentUser.email.split("@")[0];

    $("welcomeHeading").textContent = `Welcome back, ${name}!`;
    $("sidebarName").textContent = name;
    $("sidebarAvatar").textContent = name.charAt(0).toUpperCase();

    $("displayName").value = name;
    $("displayEmail").value = currentUser.email;

    $("currentDate").textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}





const pageNames = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    schedule: "Schedule",
    priorities: "Priorities",
    activity: "Activity",
    settings: "Settings"
};


function showPage(page) {
    if (!pageNames[page]) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active-page");
    });

    const target = $(page + "Page");

    if (target) {
        target.classList.add("active-page");
    }

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    $("pageTitle").textContent = pageNames[page];

    if (page === "tasks") renderTasks();
    if (page === "schedule") renderSchedule();
    if (page === "priorities") renderPriorities();
    if (page === "activity") renderActivity();
}


document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});


document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});


$("topAddTask").addEventListener("click", () => {
    showPage("tasks");

    $("taskTitle").focus();
});




$("taskDate").value = localDateString();


$("taskForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const title = $("taskTitle").value.trim();
    const dueDate = $("taskDate").value;
    const priority = $("taskPriority").value;

    if (!title) {
        showToast("Please enter a task title.");
        return;
    }

    if (!dueDate) {
        showToast("Please select a due date.");
        return;
    }

    const task = {
        id: Date.now() + Math.random(),
        title: title,
        dueDate: dueDate,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);

    saveTasks();

    logActivity(`Created task: ${title}`, "+");

    this.reset();

    $("taskDate").value = localDateString();
    $("taskPriority").value = "Medium";

    renderAll();

    showPage("tasks");

    showToast("Task added successfully.");
});




function toggleTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    task.completed = !task.completed;

    task.completedAt = task.completed
        ? new Date().toISOString()
        : null;

    saveTasks();

    logActivity(
        task.completed
            ? `Completed task: ${task.title}`
            : `Reopened task: ${task.title}`,
        task.completed ? "✓" : "↺"
    );

    renderAll();

    showToast(
        task.completed
            ? "Task completed. Nice work!"
            : "Task marked as pending."
    );
}




function changePriority(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const options = ["High", "Medium", "Low"];

    const newPriority = prompt(
        "Choose priority: High, Medium, or Low",
        task.priority
    );

    if (newPriority === null) return;

    const normalized = options.find(
        option => option.toLowerCase() === newPriority.trim().toLowerCase()
    );

    if (!normalized) {
        showToast("Enter High, Medium, or Low.");
        return;
    }

    if (task.priority === normalized) {
        showToast("Priority is already " + normalized + ".");
        return;
    }

    const previousPriority = task.priority;

    task.priority = normalized;

    saveTasks();

    logActivity(
        `Changed "${task.title}" from ${previousPriority} to ${normalized} priority`,
        "◈"
    );

    renderAll();

    showToast("Priority updated.");
}




function deleteTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    if (!confirm(`Delete "${task.title}"?`)) return;

    tasks = tasks.filter(item => item.id !== taskId);

    saveTasks();

    logActivity(`Deleted task: ${task.title}`, "×");

    renderAll();

    showToast("Task deleted.");
}




function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}


function priorityClass(priority) {
    return "priority-" + priority.toLowerCase();
}


function taskCard(task, options = {}) {
    const {
        showActions = true,
        showPriority = true
    } = options;

    const completedClass = task.completed ? "task-completed" : "";

    return `
        <div class="task-item ${completedClass}">

            <input
                type="checkbox"
                class="task-check"
                aria-label="Mark ${escapeHTML(task.title)} completed"
                data-action="toggle"
                data-id="${task.id}"
                ${task.completed ? "checked" : ""}
            >

            <div class="task-info">
                <strong>${escapeHTML(task.title)}</strong>

                <p>
                    ${escapeHTML(dueLabel(task.dueDate))}
                    · ${escapeHTML(formatDate(task.dueDate))}
                </p>
            </div>

            ${
                showPriority
                    ? `<span class="priority-badge ${priorityClass(task.priority)}">
                        ${escapeHTML(task.priority)}
                       </span>`
                    : ""
            }

            ${
                showActions
                    ? `<div class="task-actions">

                        <button
                            class="small-btn"
                            data-action="priority"
                            data-id="${task.id}"
                            title="Change priority"
                        >
                            Edit
                        </button>

                        <button
                            class="small-btn delete-btn"
                            data-action="delete"
                            data-id="${task.id}"
                            title="Delete task"
                        >
                            ×
                        </button>

                    </div>`
                    : ""
            }

        </div>
    `;
}




document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const taskId = Number(button.dataset.id);

    switch (button.dataset.action) {
        case "priority":
            changePriority(taskId);
            break;

        case "delete":
            deleteTask(taskId);
            break;

        case "complete":
        case "toggle":
            toggleTask(taskId);
            break;
    }
});




$("taskFilter").addEventListener("change", renderTasks);


function getFilteredTasks() {
    const filter = $("taskFilter").value;

    return tasks.filter(task => {
        if (filter === "All") return true;
        if (filter === "Pending") return !task.completed;
        if (filter === "Completed") return task.completed;

        return task.priority === filter;
    });
}


function sortTasks(taskArray) {
    const priorityRank = {
        High: 1,
        Medium: 2,
        Low: 3
    };

    return [...taskArray].sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        const priorityDifference =
            priorityRank[a.priority] - priorityRank[b.priority];

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        return a.dueDate.localeCompare(b.dueDate);
    });
}


function renderTasks() {
    const filteredTasks = sortTasks(getFilteredTasks());

    $("allTaskList").innerHTML = filteredTasks.length
        ? filteredTasks.map(task => taskCard(task)).join("")
        : `<div class="empty-state">No tasks match this filter.</div>`;
}



function renderDashboard() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    const highPriority = tasks.filter(
        task => task.priority === "High" && !task.completed
    ).length;

    const percent = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    $("totalTasks").textContent = tasks.length;
    $("completedTasks").textContent = completed;
    $("pendingTasks").textContent = pending;
    $("highTasks").textContent = highPriority;

    $("completionPercent").textContent = percent + "%";

    $("progressCircle").style.background = `
        conic-gradient(
            var(--primary) ${percent * 3.6}deg,
            #ececf5 ${percent * 3.6}deg
        )
    `;

    $("progressMessage").textContent = tasks.length
        ? `${completed} of ${tasks.length} tasks completed. Keep moving forward.`
        : "Start your first task to build momentum.";

    const today = localDateString();

    const todaysTasks = sortTasks(
        tasks.filter(task => task.dueDate === today)
    );

    $("dashboardTaskList").innerHTML = todaysTasks.length
        ? todaysTasks.map(task => taskCard(task)).join("")
        : `<div class="empty-state">
            Nothing scheduled for today. Add a task to get started.
           </div>`;
}



function renderSchedule() {
    const pendingTasks = sortTasks(
        tasks.filter(task => !task.completed)
    );

    const grouped = {};

    pendingTasks.forEach(task => {
        const date = task.dueDate || "No date";

        if (!grouped[date]) grouped[date] = [];

        grouped[date].push(task);
    });

    const dates = Object.keys(grouped).sort((a, b) => {
        if (a === "No date") return 1;
        if (b === "No date") return -1;

        return a.localeCompare(b);
    });

    if (!dates.length) {
        $("scheduleList").innerHTML = `
            <div class="empty-state">
                No pending tasks in your schedule.
            </div>
        `;

        return;
    }

    $("scheduleList").innerHTML = dates.map(date => {
        let heading = "No due date";

        if (date !== "No date") {
            const today = localDateString();

            if (date < today) {
                heading = "Overdue · " + formatDate(date);
            } else if (date === today) {
                heading = "Today · " + formatDate(date);
            } else {
                heading = formatDate(date);
            }
        }

        return `
            <div class="schedule-group">
                <h4>${escapeHTML(heading)}</h4>

                <div class="task-list">
                    ${grouped[date].map(task => taskCard(task)).join("")}
                </div>
            </div>
        `;
    }).join("");
}




function renderPriorities() {
    const priorityGroups = {
        High: $("highPriorityList"),
        Medium: $("mediumPriorityList"),
        Low: $("lowPriorityList")
    };

    const countIds = {
        High: "highCount",
        Medium: "mediumCount",
        Low: "lowCount"
    };

    Object.entries(priorityGroups).forEach(([priority, container]) => {
        const group = sortTasks(
            tasks.filter(task => task.priority === priority && !task.completed)
        );

        $(countIds[priority]).textContent = group.length;

        container.innerHTML = group.length
            ? group.map(task => `
                <div class="priority-task">

                    <strong>${escapeHTML(task.title)}</strong>

                    <p>${escapeHTML(dueLabel(task.dueDate))}</p>

                    <button
                        class="small-btn"
                        data-action="priority"
                        data-id="${task.id}"
                    >
                        Change priority
                    </button>

                    <button
                        class="small-btn"
                        data-action="complete"
                        data-id="${task.id}"
                    >
                        Complete
                    </button>

                </div>
            `).join("")
            : `<div class="empty-state">No pending tasks</div>`;
    });
}




function renderActivity() {
    $("activityList").innerHTML = activity.length
        ? activity.map(item => `
            <div class="activity-item">

                <div class="activity-icon">
                    ${escapeHTML(item.icon || "•")}
                </div>

                <div class="activity-info">
                    <p>${escapeHTML(item.message)}</p>

                    <time>
                        ${escapeHTML(formatTimestamp(item.time))}
                    </time>
                </div>

            </div>
        `).join("")
        : `<div class="empty-state">
            No activity yet. Your actions will appear here.
           </div>`;
}


$("clearActivity").addEventListener("click", function () {
    if (!activity.length) {
        showToast("There is no activity history to clear.");
        return;
    }

    if (!confirm("Clear all activity history?")) return;

    activity = [];

    saveActivity();
    renderActivity();

    showToast("Activity history cleared.");
});




$("settingsForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("displayName").value.trim();

    if (!name) {
        showToast("Please enter a display name.");
        return;
    }

    currentUser.name = name;

    localStorage.setItem(
        STORAGE.user,
        JSON.stringify(currentUser)
    );

    updateUserInterface();

    logActivity("Updated workspace display name", "⚙");

    showToast("Settings saved.");
});




$("resetTasks").addEventListener("click", function () {
    if (!tasks.length) {
        showToast("There are no tasks to delete.");
        return;
    }

    if (!confirm("Permanently delete all tasks? This cannot be undone.")) {
        return;
    }

    tasks = [];

    saveTasks();

    logActivity("Deleted all tasks", "×");

    renderAll();

    showToast("All tasks deleted.");
});




function renderAll() {
    renderDashboard();
    renderTasks();
    renderSchedule();
    renderPriorities();
    renderActivity();
}



loadData();

if (currentUser && currentUser.email) {
    openApp();
} else {
    $("loginPage").classList.remove("hidden");
    $("app").classList.add("hidden");
}


