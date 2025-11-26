const API_URL = "http://localhost:3000/api";

// State
let tasks = [];
let members = [];
let currentFilter = "all";
let sortOrder = "desc"; // 'desc' = Haute → Basse, 'asc' = Basse → Haute

// DOM Elements
const todoList = document.getElementById("todo-list");
const inprogressList = document.getElementById("inprogress-list");
const doneList = document.getElementById("done-list");
const modal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");
const addTaskBtn = document.getElementById("add-task-btn");
const closeBtn = document.querySelector(".close");
const filterBtns = document.querySelectorAll(".filter-btn");
const assignedToSelect = document.getElementById("assignedTo");
const sortOrderSelect = document.getElementById("sort-order");
const memberModal = document.getElementById("member-modal");
const memberForm = document.getElementById("member-form");
const addMemberBtn = document.getElementById("add-member-btn");
const closeMemberBtn = document.querySelector(".close-member");

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await fetchMembers();
  await fetchTasks();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  addTaskBtn.addEventListener("click", () => openModal());
  closeBtn.addEventListener("click", () => closeModal());
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  taskForm.addEventListener("submit", handleFormSubmit);

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.status;
      renderTasks();
    });
  });

  sortOrderSelect.addEventListener("change", (e) => {
    sortOrder = e.target.value;
    renderTasks();
  });

  addMemberBtn.addEventListener("click", () => openMemberModal());
  closeMemberBtn.addEventListener("click", () => closeMemberModal());
  window.addEventListener("click", (e) => {
    if (e.target === memberModal) closeMemberModal();
  });

  memberForm.addEventListener("submit", handleMemberFormSubmit);
}

// API Calls
async function fetchMembers() {
  try {
    const res = await fetch(`${API_URL}/members`);
    members = await res.json();
    populateMemberSelect();
  } catch (err) {
    console.error("Error fetching members:", err);
  }
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API_URL}/tasks`);
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error fetching tasks:", err);
  }
}

async function createTask(task) {
  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const newTask = await res.json();
    tasks.push(newTask);
    renderTasks();
    closeModal();
  } catch (err) {
    console.error("Error creating task:", err);
  }
}

async function updateTask(id, updates) {
  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updatedTask = await res.json();
    const index = tasks.findIndex((t) => t._id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      renderTasks();
    }
    closeModal();
  } catch (err) {
    console.error("Error updating task:", err);
  }
}

async function deleteTask(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

  try {
    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t._id !== id);
    renderTasks();
  } catch (err) {
    console.error("Error deleting task:", err);
  }
}

// UI Functions
function renderTasks() {
  // Clear lists
  todoList.innerHTML = "";
  inprogressList.innerHTML = "";
  doneList.innerHTML = "";

  const filteredTasks =
    currentFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === currentFilter);

  // Sort by priority
  const sortedTasks = sortTasksByPriority(filteredTasks);

  sortedTasks.forEach((task) => {
    const card = createTaskCard(task);
    if (task.status === "todo") todoList.appendChild(card);
    else if (task.status === "in_progress") inprogressList.appendChild(card);
    else if (task.status === "done") doneList.appendChild(card);
  });

  setupDragAndDrop();
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
      openModal(task);
    }
  };

  const assignedMember = members.find(
    (m) => m._id === (task.assignedTo?._id || task.assignedTo)
  );
  const memberName = assignedMember ? assignedMember.name : "Non assigné";

  div.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <span class="task-priority priority-${task.priority}">${
    task.priority
  }</span>
        </div>
        <div class="task-desc">${task.description || ""}</div>
        <div class="task-footer">
            <span>${memberName}</span>
            <button class="btn btn-danger btn-delete" onclick="event.stopPropagation(); deleteTask('${
              task._id
            }')">Supprimer</button>
        </div>
    `;
  return div;
}

function populateMemberSelect() {
  assignedToSelect.innerHTML = '<option value="">Non assigné</option>';
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member._id;
    option.textContent = member.name;
    assignedToSelect.appendChild(option);
  });
}

function setupDragAndDrop() {
  const draggables = document.querySelectorAll(".task-card");
  const containers = document.querySelectorAll(".task-list");

  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", () => {
      draggable.classList.add("dragging");
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
    });
  });

  containers.forEach((container) => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(container, e.clientY);
      const draggable = document.querySelector(".dragging");
      if (afterElement == null) {
        container.appendChild(draggable);
      } else {
        container.insertBefore(draggable, afterElement);
      }
    });

    container.addEventListener("drop", async (e) => {
      const draggable = document.querySelector(".dragging");
      const newStatus = container.id
        .replace("-list", "")
        .replace("inprogress", "in_progress");
      const taskId = draggable.dataset.id;

      // Find task and update status locally first for responsiveness
      const task = tasks.find((t) => t._id === taskId);
      if (task && task.status !== newStatus) {
        const oldStatus = task.status;
        task.status = newStatus;

        try {
          await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
        } catch (err) {
          console.error("Error updating task status on drop:", err);
          // Revert on error
          task.status = oldStatus;
          renderTasks();
        }
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function openModal(task = null) {
  modal.style.display = "block";
  const title = document.getElementById("modal-title");
  const form = document.getElementById("task-form");

  if (task) {
    title.textContent = "Modifier la Tâche";
    document.getElementById("task-id").value = task._id;
    document.getElementById("title").value = task.title;
    document.getElementById("description").value = task.description || "";
    document.getElementById("priority").value = task.priority;
    document.getElementById("status").value = task.status;
    document.getElementById("assignedTo").value =
      task.assignedTo?._id || task.assignedTo || "";
  } else {
    title.textContent = "Nouvelle Tâche";
    form.reset();
    document.getElementById("task-id").value = "";
  }
}

function closeModal() {
  modal.style.display = "none";
}

function handleFormSubmit(e) {
  e.preventDefault();

  const taskData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    priority: document.getElementById("priority").value,
    status: document.getElementById("status").value,
    assignedTo: document.getElementById("assignedTo").value || null,
  };

  const id = document.getElementById("task-id").value;

  if (id) {
    updateTask(id, taskData);
  } else {
    createTask(taskData);
  }
}

// Member Management Functions
async function createMember(member) {
  try {
    const res = await fetch(`${API_URL}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    const newMember = await res.json();
    members.push(newMember);
    populateMemberSelect();
    closeMemberModal();
    alert(`Membre "${newMember.name}" ajouté avec succès!`);
  } catch (err) {
    console.error("Error creating member:", err);
    alert("Erreur lors de l'ajout du membre.");
  }
}

function openMemberModal() {
  memberModal.style.display = "block";
  memberForm.reset();
}

function closeMemberModal() {
  memberModal.style.display = "none";
}

function handleMemberFormSubmit(e) {
  e.preventDefault();

  const memberData = {
    name: document.getElementById("member-name").value,
    email: document.getElementById("member-email").value || undefined,
  };

  createMember(memberData);
}
