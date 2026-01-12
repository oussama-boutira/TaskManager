const API_URL = "http://localhost:3000/api";

// State
let tasks = [];
let members = [];
let projects = [];
let currentProject = null;
let currentFilter = "all";
let sortOrder = "desc";
let currentMemberFilter = "all";
let currentPage = "login";
let currentUser = null;
let token = localStorage.getItem("token");

// Charts
let statusChart = null;
let priorityChart = null;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  if (token) {
    await checkAuth();
  } else {
    showLogin();
  }
  setupEventListeners();
});

// Auth Functions
async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      currentUser = await res.json();
      initializeApp();
    } else {
      logout();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    logout();
  }
}

async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      localStorage.setItem("token", token);
      currentUser = data.user;
      initializeApp();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login error");
  }
}

async function register(name, email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      localStorage.setItem("token", token);
      currentUser = data.user;
      initializeApp();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    console.error("Registration error:", err);
    alert("Registration error");
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  showLogin();
}

function showLogin() {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("login-page").classList.add("active");
  document.getElementById("sidebar").style.display = "none";
}

function showRegister() {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("register-page").classList.add("active");
  document.getElementById("sidebar").style.display = "none";
}

async function initializeApp() {
  try {
    document.getElementById("sidebar").style.display = "flex";
    updateUIForRole();

    // Navigate immediately to show the dashboard structure
    navigateTo("dashboard");

    // Initialize components
    initializeCharts();

    // Fetch data
    await fetchProjects();
    await fetchMembers();
    await fetchTasks();
  } catch (err) {
    console.error("Error initializing app:", err);
  }
}

function updateUIForRole() {
  const membersLink = document.getElementById("nav-members");
  const dashboardLink = document.getElementById("nav-dashboard");
  const logoutBtn = document.getElementById("logout-btn");

  // Elements to hide/show based on role
  const addProjectBtn = document.getElementById("add-project-btn");
  const addMemberBtn = document.getElementById("add-member-btn");
  const addTaskBtn = document.getElementById("add-task-btn");
  const memberFilterContainer =
    document.getElementById("member-filter")?.parentElement; // The .sort-container

  if (dashboardLink) dashboardLink.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "block";

  const isAdmin = currentUser && currentUser.role === "admin";

  // Sidebar links
  if (membersLink) membersLink.style.display = isAdmin ? "block" : "none";

  // Action buttons
  if (addProjectBtn) addProjectBtn.style.display = isAdmin ? "block" : "none";
  if (addMemberBtn) addMemberBtn.style.display = isAdmin ? "block" : "none";
  if (addTaskBtn) addTaskBtn.style.display = isAdmin ? "block" : "none";

  // Filters
  if (memberFilterContainer)
    memberFilterContainer.style.display = isAdmin ? "flex" : "none";
}

// ... (Navigation and Event Listeners remain the same) ...

// Dashboard Charts
function initializeCharts() {
  try {
    const statusCanvas = document.getElementById("statusChart");
    const priorityCanvas = document.getElementById("priorityChart");

    if (!statusCanvas || !priorityCanvas) {
      console.warn("Chart canvases not found");
      return;
    }

    if (statusChart) statusChart.destroy();
    if (priorityChart) priorityChart.destroy();

    const statusCtx = statusCanvas.getContext("2d");
    const priorityCtx = priorityCanvas.getContext("2d");

    statusChart = new Chart(statusCtx, {
      type: "doughnut",
      data: {
        labels: ["À faire", "En cours", "Terminé"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#fca5a5", "#93c5fd", "#86efac"],
          },
        ],
      },
    });

    priorityChart = new Chart(priorityCtx, {
      type: "bar",
      data: {
        labels: ["Haute", "Moyenne", "Basse"],
        datasets: [
          {
            label: "Nombre de tâches",
            data: [0, 0, 0],
            backgroundColor: "#4f46e5",
          },
        ],
      },
    });
  } catch (err) {
    console.error("Error initializing charts:", err);
  }
}

function updateDashboard() {
  if (!tasks) return;

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inprogressCount = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const totalTasksEl = document.getElementById("total-tasks");
  const todoCountEl = document.getElementById("todo-count");
  const inprogressCountEl = document.getElementById("inprogress-count");
  const doneCountEl = document.getElementById("done-count");

  if (totalTasksEl) totalTasksEl.textContent = tasks.length;
  if (todoCountEl) todoCountEl.textContent = todoCount;
  if (inprogressCountEl) inprogressCountEl.textContent = inprogressCount;
  if (doneCountEl) doneCountEl.textContent = doneCount;

  if (statusChart) {
    statusChart.data.datasets[0].data = [todoCount, inprogressCount, doneCount];
    statusChart.update();
  }

  if (priorityChart) {
    const hauteCount = tasks.filter((t) => t.priority === "Haute").length;
    const moyenneCount = tasks.filter((t) => t.priority === "Moyenne").length;
    const basseCount = tasks.filter((t) => t.priority === "Basse").length;
    priorityChart.data.datasets[0].data = [
      hauteCount,
      moyenneCount,
      basseCount,
    ];
    priorityChart.update();
  }
}

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll("[data-page]");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });

  document.getElementById("logout-btn").addEventListener("click", logout);

  // Auth toggle links
  document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    showRegister();
  });

  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    showLogin();
  });
}

function navigateTo(page) {
  // Hide all pages
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));

  // Show selected page
  document.getElementById(`${page}-page`).classList.add("active");

  // Update sidebar active state
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  currentPage = page;

  // Refresh data for the page
  if (page === "members") {
    renderMembersTable();
  } else if (page === "dashboard") {
    renderTasks();
  }
}

// Event Listeners
function setupEventListeners() {
  // Login form
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    login(email, password);
  });

  // Register form
  document.getElementById("register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    register(name, email, password);
  });

  setupNavigation();

  // Task modal
  document
    .getElementById("add-task-btn")
    .addEventListener("click", () => openTaskModal());
  document
    .querySelector(".close")
    .addEventListener("click", () => closeTaskModal());
  document
    .getElementById("task-form")
    .addEventListener("submit", handleTaskFormSubmit);

  // Member modal
  document
    .getElementById("add-member-btn")
    .addEventListener("click", () => openMemberModal());
  document
    .getElementById("add-member-btn-page")
    .addEventListener("click", () => openMemberModal());
  document
    .querySelector(".close-member")
    .addEventListener("click", () => closeMemberModal());
  document
    .getElementById("member-form")
    .addEventListener("submit", handleMemberFormSubmit);

  // Project modal
  document
    .getElementById("add-project-btn")
    .addEventListener("click", () => openProjectModal());
  document
    .querySelector(".close-project")
    .addEventListener("click", () => closeProjectModal());
  document
    .getElementById("project-form")
    .addEventListener("submit", handleProjectFormSubmit);

  // Filters
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.status;
      renderTasks();
    });
  });

  document.getElementById("sort-order").addEventListener("change", (e) => {
    sortOrder = e.target.value;
    renderTasks();
  });

  document.getElementById("member-filter").addEventListener("change", (e) => {
    currentMemberFilter = e.target.value;
    renderTasks();
  });

  // Sidebar toggle
  document.getElementById("sidebar-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // Modal close on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
}

// Helper for authenticated fetch
async function authFetch(url, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }
  return res;
}

// API Calls - Projects
async function fetchProjects() {
  try {
    const res = await authFetch(`${API_URL}/projects`);
    projects = await res.json();
    renderProjects();
    if (projects.length > 0 && !currentProject) {
      switchProject(projects[0]);
    }
  } catch (err) {
    console.error("Error fetching projects:", err);
  }
}

async function createProject(project) {
  try {
    const res = await authFetch(`${API_URL}/projects`, {
      method: "POST",
      body: JSON.stringify(project),
    });
    const newProject = await res.json();
    projects.push(newProject);
    renderProjects();
    closeProjectModal();
    switchProject(newProject);
  } catch (err) {
    console.error("Error creating project:", err);
    alert("Erreur lors de la création du projet (Admin seulement)");
  }
}

async function deleteProject(id) {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer ce projet et toutes ses tâches ?"
    )
  )
    return;

  try {
    await authFetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
    projects = projects.filter((p) => p._id !== id);
    if (currentProject && currentProject._id === id) {
      if (projects.length > 0) {
        switchProject(projects[0]);
      } else {
        currentProject = null;
        tasks = [];
        renderTasks();
      }
    }
    renderProjects();
  } catch (err) {
    console.error("Error deleting project:", err);
    alert("Erreur lors de la suppression du projet (Admin seulement)");
  }
}

function renderProjects() {
  const projectsList = document.getElementById("projects-list");
  projectsList.innerHTML = "";

  projects.forEach((project) => {
    const div = document.createElement("div");
    div.className = "project-item";
    if (currentProject && currentProject._id === project._id) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <div class="project-color" style="background-color: ${project.color}"></div>
      <span class="project-name">${project.name}</span>
    `;

    div.onclick = () => switchProject(project);
    div.oncontextmenu = (e) => {
      e.preventDefault();
      if (currentUser && currentUser.role === "admin") {
        if (confirm("Voulez-vous supprimer ce projet ?")) {
          deleteProject(project._id);
        }
      }
    };

    projectsList.appendChild(div);
  });
}

function switchProject(project) {
  currentProject = project;
  renderProjects();
  fetchTasks();
}

// API Calls - Members
async function fetchMembers() {
  try {
    const res = await authFetch(`${API_URL}/members`);
    members = await res.json();
    populateMemberSelect();
    populateMemberFilter();
  } catch (err) {
    console.error("Error fetching members:", err);
  }
}

async function createMember(member) {
  try {
    const res = await authFetch(`${API_URL}/members`, {
      method: "POST",
      body: JSON.stringify(member),
    });
    const newMember = await res.json();
    members.push(newMember);
    populateMemberSelect();
    populateMemberFilter();
    renderMembersTable();
    closeMemberModal();
    alert(`Membre "${newMember.name}" ajouté avec succès!`);
  } catch (err) {
    console.error("Error creating member:", err);
    alert("Erreur (Admin seulement)");
  }
}

async function updateMember(id, updates) {
  try {
    const res = await authFetch(`${API_URL}/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    const updatedMember = await res.json();
    const index = members.findIndex((m) => m._id === id);
    if (index !== -1) {
      members[index] = updatedMember;
      renderMembersTable();
      populateMemberSelect();
      populateMemberFilter();
    }
    closeMemberModal();
  } catch (err) {
    console.error("Error updating member:", err);
    alert("Erreur (Admin seulement)");
  }
}

async function deleteMember(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;

  try {
    await authFetch(`${API_URL}/members/${id}`, { method: "DELETE" });
    members = members.filter((m) => m._id !== id);
    renderMembersTable();
    populateMemberSelect();
    populateMemberFilter();
    alert("Membre supprimé avec succès!");
  } catch (err) {
    console.error("Error deleting member:", err);
    alert("Erreur (Admin seulement)");
  }
}

function populateMemberSelect() {
  const select = document.getElementById("assignedTo");
  select.innerHTML = '<option value="">Non assigné</option>';
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member._id;
    option.textContent = member.name;
    select.appendChild(option);
  });
}

function populateMemberFilter() {
  const select = document.getElementById("member-filter");
  select.innerHTML = '<option value="all">Tous les membres</option>';
  select.innerHTML += '<option value="unassigned">Non assignés</option>';
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member._id;
    option.textContent = member.name;
    select.appendChild(option);
  });
}

function renderMembersTable() {
  const tbody = document.getElementById("members-table-body");
  tbody.innerHTML = "";

  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Aucun membre trouvé.
        </td>
      </tr>
    `;
    return;
  }

  members.forEach((member) => {
    const tr = document.createElement("tr");
    const createdDate = new Date(member.createdAt).toLocaleDateString("fr-FR");

    tr.innerHTML = `
      <td><strong>${member.name}</strong></td>
      <td>${
        member.email ||
        '<em style="color: var(--text-secondary);">Pas d\'email</em>'
      }</td>
      <td>${createdDate}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-primary" onclick="editMember('${
            member._id
          }')">Éditer</button>
          <button class="btn btn-danger" onclick="deleteMember('${
            member._id
          }')">Supprimer</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

window.editMember = function (id) {
  const member = members.find((m) => m._id === id);
  if (!member) return;

  document.getElementById("member-modal-title").textContent =
    "Modifier le Membre";
  document.getElementById("member-id").value = member._id;
  document.getElementById("member-name").value = member.name;
  document.getElementById("member-email").value = member.email || "";
  document.getElementById("member-modal").style.display = "block";
};

// API Calls - Tasks
async function fetchTasks() {
  try {
    let url = `${API_URL}/tasks`;
    if (currentProject) {
      url += `?project=${currentProject._id}`;
    }
    const res = await authFetch(url);
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error fetching tasks:", err);
  }
}

async function createTask(task) {
  try {
    if (currentProject) {
      task.project = currentProject._id;
    }
    const res = await authFetch(`${API_URL}/tasks`, {
      method: "POST",
      body: JSON.stringify(task),
    });
    const newTask = await res.json();
    tasks.push(newTask);
    renderTasks();
    closeTaskModal();
  } catch (err) {
    console.error("Error creating task:", err);
  }
}

async function updateTask(id, updates) {
  try {
    const res = await authFetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    const updatedTask = await res.json();
    const index = tasks.findIndex((t) => t._id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      renderTasks();
    }
    closeTaskModal();
  } catch (err) {
    console.error("Error updating task:", err);
  }
}

async function deleteTask(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

  try {
    await authFetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t._id !== id);
    renderTasks();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}

window.deleteTask = deleteTask;

function renderTasks() {
  const todoList = document.getElementById("todo-list");
  const inprogressList = document.getElementById("inprogress-list");
  const doneList = document.getElementById("done-list");

  todoList.innerHTML = "";
  inprogressList.innerHTML = "";
  doneList.innerHTML = "";

  let filteredTasks =
    currentFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === currentFilter);

  filteredTasks =
    currentMemberFilter === "all"
      ? filteredTasks
      : filteredTasks.filter((t) => {
          const assignedId = t.assignedTo?._id || t.assignedTo;
          return currentMemberFilter === "unassigned"
            ? !assignedId
            : assignedId === currentMemberFilter;
        });

  const sortedTasks = sortTasksByPriority(filteredTasks);

  sortedTasks.forEach((task) => {
    const card = createTaskCard(task);
    if (task.status === "todo") todoList.appendChild(card);
    else if (task.status === "in_progress") inprogressList.appendChild(card);
    else if (task.status === "done") doneList.appendChild(card);
  });

  setupDragAndDrop();
  updateDashboard();
}

function sortTasksByPriority(taskList) {
  const priorityOrder = { Haute: 1, Moyenne: 2, Basse: 3 };
  return [...taskList].sort((a, b) => {
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
    return sortOrder === "desc" ? diff : -diff;
  });
}

function createTaskCard(task) {
  const div = document.createElement("div");
  div.className = "task-card";
  div.draggable = true;
  div.dataset.id = task._id;
  div.onclick = (e) => {
    if (!e.target.closest(".btn-delete")) {
      openTaskModal(task);
    }
  };

  const assignedMember = members.find(
    (m) => m._id === (task.assignedTo?._id || task.assignedTo)
  );
  const memberName = assignedMember ? assignedMember.name : "Non assigné";

  let dateHtml = "";
  if (task.startDate || task.dueDate) {
    const start = task.startDate
      ? new Date(task.startDate).toLocaleDateString("fr-FR")
      : "...";
    const end = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("fr-FR")
      : "...";
    
    let dateStyle = "color: var(--text-secondary);";
    let overdueText = "";

    if (task.dueDate && task.status !== 'done') {
      const dueDateObj = new Date(task.dueDate);
      const now = new Date();
      // Check if overdue
      if (now > dueDateObj) {
        dateStyle = "color: #ef4444; font-weight: 600;";
        overdueText = " ( en retard )";
      }
    }

    dateHtml = `<div class="task-dates" style="font-size: 0.75rem; ${dateStyle} margin-bottom: 0.5rem;">
      📅 ${start} - ${end}${overdueText}
    </div>`;
  }

  div.innerHTML = `
    <div class="task-header">
      <span class="task-title">${task.title}</span>
      <span class="task-priority priority-${task.priority}">${
    task.priority
  }</span>
    </div>
    <div class="task-desc">${task.description || ""}</div>
    ${dateHtml}
    <div class="task-footer">
      <span>${memberName}</span>
      ${
        currentUser && currentUser.role === "admin"
          ? `<button class="btn btn-danger btn-delete" onclick="event.stopPropagation(); deleteTask('${task._id}')">Supprimer</button>`
          : ""
      }
    </div>
  `;
  return div;
}

function setupDragAndDrop() {
  const draggables = document.querySelectorAll(".task-card");
  const containers = document.querySelectorAll(".task-list");

  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", () =>
      draggable.classList.add("dragging")
    );
    draggable.addEventListener("dragend", () =>
      draggable.classList.remove("dragging")
    );
  });

  containers.forEach((container) => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggable = document.querySelector(".dragging");
      container.appendChild(draggable);
    });

    container.addEventListener("drop", async (e) => {
      e.preventDefault();
      const draggable = document.querySelector(".dragging");
      const taskId = draggable.dataset.id;
      const newStatus = container.id.replace("-list", "");
      await updateTask(taskId, { status: newStatus });
    });
  });
}

function openTaskModal(task = null) {
  const modal = document.getElementById("task-modal");
  const title = document.getElementById("modal-title");

  if (task) {
    title.textContent = "Modifier la Tâche";
    document.getElementById("task-id").value = task._id;
    document.getElementById("title").value = task.title;
    document.getElementById("description").value = task.description || "";
    document.getElementById("priority").value = task.priority;
    document.getElementById("status").value = task.status;
    document.getElementById("assignedTo").value =
      task.assignedTo?._id || task.assignedTo || "";
    document.getElementById("startDate").value = task.startDate
      ? task.startDate.split("T")[0]
      : "";
    document.getElementById("dueDate").value = task.dueDate
      ? task.dueDate.split("T")[0]
      : "";
  } else {
    title.textContent = "Nouvelle Tâche";
    document.getElementById("task-form").reset();
    document.getElementById("task-id").value = "";
  }

  modal.style.display = "block";
}

function closeTaskModal() {
  document.getElementById("task-modal").style.display = "none";
}

function handleTaskFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const priority = document.getElementById("priority").value;
  const status = document.getElementById("status").value;
  const assignedTo = document.getElementById("assignedTo").value;
  const startDate = document.getElementById("startDate").value;
  const dueDate = document.getElementById("dueDate").value;

  const taskData = {
    title,
    description,
    priority,
    status,
    assignedTo: assignedTo || null,
    startDate: startDate || null,
    dueDate: dueDate || null,
  };

  const id = document.getElementById("task-id").value;
  if (id) {
    updateTask(id, taskData);
  } else {
    createTask(taskData);
  }
}

function openMemberModal() {
  const modal = document.getElementById("member-modal");
  document.getElementById("member-modal-title").textContent = "Nouveau Membre";
  document.getElementById("member-form").reset();
  document.getElementById("member-id").value = "";
  modal.style.display = "block";
}

function closeMemberModal() {
  document.getElementById("member-modal").style.display = "none";
}

function handleMemberFormSubmit(e) {
  e.preventDefault();

  const memberData = {
    name: document.getElementById("member-name").value,
    email: document.getElementById("member-email").value || undefined,
  };

  const id = document.getElementById("member-id").value;
  if (id) {
    updateMember(id, memberData);
  } else {
    createMember(memberData);
  }
}

function openProjectModal() {
  const modal = document.getElementById("project-modal");
  document.getElementById("project-form").reset();
  document.getElementById("project-id").value = "";
  document.getElementById("project-color").value = "#4f46e5";
  modal.style.display = "block";
}

function closeProjectModal() {
  document.getElementById("project-modal").style.display = "none";
}

function handleProjectFormSubmit(e) {
  e.preventDefault();

  const projectData = {
    name: document.getElementById("project-name").value,
    description: document.getElementById("project-description").value,
    color: document.getElementById("project-color").value,
  };

  createProject(projectData);
}

// Dashboard Charts
function initializeCharts() {
  try {
    const statusCanvas = document.getElementById("statusChart");
    const priorityCanvas = document.getElementById("priorityChart");

    if (!statusCanvas || !priorityCanvas) {
      console.warn("Chart canvases not found");
      return;
    }

    if (statusChart) statusChart.destroy();
    if (priorityChart) priorityChart.destroy();

    const statusCtx = statusCanvas.getContext("2d");
    const priorityCtx = priorityCanvas.getContext("2d");

    statusChart = new Chart(statusCtx, {
      type: "doughnut",
      data: {
        labels: ["À faire", "En cours", "Terminé"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#fca5a5", "#93c5fd", "#86efac"],
          },
        ],
      },
    });

    priorityChart = new Chart(priorityCtx, {
      type: "bar",
      data: {
        labels: ["Haute", "Moyenne", "Basse"],
        datasets: [
          {
            label: "Nombre de tâches",
            data: [0, 0, 0],
            backgroundColor: "#4f46e5",
          },
        ],
      },
    });
  } catch (err) {
    console.error("Error initializing charts:", err);
  }
}

function updateDashboard() {
  if (!tasks) return;

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inprogressCount = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const totalTasksEl = document.getElementById("total-tasks");
  const todoCountEl = document.getElementById("todo-count");
  const inprogressCountEl = document.getElementById("inprogress-count");
  const doneCountEl = document.getElementById("done-count");

  if (totalTasksEl) totalTasksEl.textContent = tasks.length;
  if (todoCountEl) todoCountEl.textContent = todoCount;
  if (inprogressCountEl) inprogressCountEl.textContent = inprogressCount;
  if (doneCountEl) doneCountEl.textContent = doneCount;

  if (statusChart) {
    statusChart.data.datasets[0].data = [todoCount, inprogressCount, doneCount];
    statusChart.update();
  }

  if (priorityChart) {
    const hauteCount = tasks.filter((t) => t.priority === "Haute").length;
    const moyenneCount = tasks.filter((t) => t.priority === "Moyenne").length;
    const basseCount = tasks.filter((t) => t.priority === "Basse").length;
    priorityChart.data.datasets[0].data = [
      hauteCount,
      moyenneCount,
      basseCount,
    ];
    priorityChart.update();
  }
}
