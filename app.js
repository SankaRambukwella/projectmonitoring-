// DOM Elements
const projectNameInput = document.getElementById("projectName");
const startDateInput = document.getElementById("startDate");
const statusSelect = document.getElementById("statusSelect");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectRows = document.getElementById("projectRows");
const totalProjectsSpan = document.getElementById("totalProjects");
const overdueProjectsSpan = document.getElementById("overdueProjects");
const exportPdfBtn = document.getElementById("exportPdf");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");

let projects = [];
let currentPage = 1;
const rowsPerPage = 5;

// Project status timeline and durations
const statusDurations = {
  "Estimate": 7,
  "Bidding Documents": 7,
  "Procurement Schedule": 5,
  "Bid Document Evaluation": 21,
  "Bid Invitation": 5,
  "Bid Document Hand Over": 14,
  "Bid Opening & Committee Minute": 3,
  "Send to TEC": 2,
  "TEC Report": 14,
  "Send Procurement Branch": 2,
  "Procurement Approval": 14,
};

// Add Project
addProjectBtn.addEventListener("click", () => {
  const projectName = projectNameInput.value.trim();
  const startDate = startDateInput.value;
  const status = statusSelect.value;

  if (!projectName || !startDate) {
    alert("Please enter all fields.");
    return;
  }

  const deadline = calculateProjectDeadline(startDate, status);
  const newProject = {
    id: projects.length + 1,
    name: projectName,
    startDate: startDate,
    status: status,
    deadline: deadline,
  };

  projects.push(newProject);
  projectNameInput.value = "";
  startDateInput.value = "";
  statusSelect.value = "Estimate";

  saveProjects();  // Save to local storage
  renderProjects();
  updateSummary();
  checkOverdueProjects();  // Check for overdue projects after update
});

// Calculate total project deadline based on current status
function calculateProjectDeadline(startDate, currentStatus) {
  let totalDays = 0;
  for (const [status, days] of Object.entries(statusDurations)) {
    totalDays += days;
    if (status === currentStatus) break;
  }
  const start = new Date(startDate);
  start.setDate(start.getDate() + totalDays);
  return start.toISOString().split("T")[0];
}

// Render project list
function renderProjects() {
  projectRows.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedProjects = projects.slice(start, end);

  paginatedProjects.forEach((project, index) => {
    const row = document.createElement("tr");

    const isOverdue = new Date(project.deadline) < new Date();
    row.style.backgroundColor = isOverdue ? "#ffcccc" : ""; // Light red for overdue

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${project.name}</td>
      <td>${project.startDate}</td>
      <td>
        <select class="form-select statusSelectEditable">
          ${getStatusOptions(project.status)}
        </select>
      </td>
      <td class="${isOverdue ? 'blinking-overdue' : ''}">${project.deadline}</td>
      <td><button class="btn btn-danger btn-sm deleteBtn">Delete</button></td>
    `;

    // Status change event
    row.querySelector(".statusSelectEditable").addEventListener("change", (e) => {
      project.status = e.target.value;
      project.deadline = calculateProjectDeadline(project.startDate, project.status);
      saveProjects();  // Save to local storage after updating status
      renderProjects();
      updateSummary();
      checkOverdueProjects(); // Re-check for overdue projects
    });

    // Delete project event
    row.querySelector(".deleteBtn").addEventListener("click", () => {
      projects = projects.filter((p) => p.id !== project.id);
      saveProjects();  // Save to local storage after deleting project
      renderProjects();
      updateSummary();
      checkOverdueProjects(); // Re-check for overdue projects
    });

    projectRows.appendChild(row);
  });
}

// Update summary
function updateSummary() {
  totalProjectsSpan.textContent = projects.length;
  const overdueProjects = projects.filter((project) => new Date(project.deadline) < new Date());
  overdueProjectsSpan.textContent = overdueProjects.length;
}

// Get status options HTML
function getStatusOptions(selectedStatus) {
  return Object.keys(statusDurations).map(
    (status) =>
      `<option value="${status}" ${
        status === selectedStatus ? "selected" : ""
      }>${status}</option>`
  ).join("");
}

// Check for overdue projects
function checkOverdueProjects() {
  const overdueProjects = projects.filter((project) => new Date(project.deadline) < new Date());
  overdueProjects.forEach((project) => {
    const row = document.querySelector(`#projectRow-${project.id}`);
    if (row) row.classList.add("overdue");
  });
}

// Save projects to local storage
function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

// Load projects from local storage
function loadProjects() {
  const storedProjects = localStorage.getItem("projects");
  if (storedProjects) {
    projects = JSON.parse(storedProjects);
  }
}

// Pagination functionality
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderProjects();
  }
});

nextPageBtn.addEventListener("click", () => {
  if (currentPage < Math.ceil(projects.length / rowsPerPage)) {
    currentPage++;
    renderProjects();
  }
});

// Export to PDF functionality
exportPdfBtn.addEventListener("click", () => {
  const doc = new jsPDF();
  const table = projects.map((project) => [
    project.name,
    project.startDate,
    project.status,
    project.deadline,
  ]);

  doc.autoTable({
    head: [["Project Name", "Start Date", "Status", "Deadline"]],
    body: table,
  });

  doc.save("projects.pdf");
});

// Load projects when page is loaded
window.onload = () => {
  loadProjects();
  renderProjects();
  updateSummary();
  checkOverdueProjects();
};
