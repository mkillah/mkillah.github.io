// Project hub page (Data analysis & statistics, NLP, ...).
// Reads a projects.json manifest and renders project cards
// (grouped by category) plus the methods toolkit.
// Filters are kept in the URL, e.g. ?category=academic&method=t-test
//
// The hub is configured on <main>:
//   data-projects-dir  folder with projects.json and the .md reports
//   data-report-page   page that shows a single report

const hubConfig = document.querySelector("main")?.dataset || {};
const PROJECTS_DIR = hubConfig.projectsDir || "content/data-projects/";
const REPORT_PAGE = hubConfig.reportPage || "data-project.html";
const MANIFEST_URL = `${PROJECTS_DIR}projects.json`;

const state = { category: "all", method: null };
let manifest = null;
let methodsById = {};


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function projectsUsing(methodId) {
  return manifest.projects.filter((project) => project.methods.includes(methodId));
}


// ----- State and URL -----

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const method = params.get("method");

  state.category = manifest.categories[category] ? category : "all";
  state.method = methodsById[method] ? method : null;
}

function writeStateToUrl() {
  const params = new URLSearchParams();
  if (state.category !== "all") params.set("category", state.category);
  if (state.method) params.set("method", state.method);

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  history.replaceState(null, "", url);
}

function setState(changes) {
  Object.assign(state, changes);
  writeStateToUrl();
  render();
}


// ----- Rendering -----

function renderStats() {
  const projects = manifest.projects;
  const methodCount = Object.keys(methodsById).length;

  // One stat per category that has projects
  const categoryStats = Object.entries(manifest.categories)
    .map(([key, category]) => [projects.filter((p) => p.category === key).length, category.label])
    .filter(([count]) => count > 0);

  document.getElementById("hub-stats").innerHTML = [
    [projects.length, "Projects"],
    ...categoryStats,
    [methodCount, "Methods"]
  ].map(([value, label]) => `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`).join("");
}

function renderCategoryButtons() {
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === state.category));
  });
}

function renderMethodChips() {
  // Only offer methods that at least one project uses
  const used = Object.values(methodsById).filter((method) => projectsUsing(method.id).length > 0);

  const chips = used.map((method) => `
    <button type="button" class="method-chip" data-method="${method.id}"
            aria-pressed="${state.method === method.id}">
      ${escapeHtml(method.name)}
    </button>`);

  if (state.method) {
    chips.push(`<button type="button" class="method-chip method-chip-clear" data-method="">Clear ✕</button>`);
  }

  document.getElementById("method-chips").innerHTML = chips.join("");
  // Hide the filter when no project uses any method yet
  document.querySelector(".method-filter").style.display = chips.length ? "" : "none";
}

function projectCard(project) {
  const category = manifest.categories[project.category];

  const methods = project.methods
    .filter((id) => methodsById[id])
    .map((id) => `<li class="${id === state.method ? "is-match" : ""}">${escapeHtml(methodsById[id].name)}</li>`)
    .join("");

  return `
    <div class="col-lg-4 col-md-6">
      <a class="project-card project-${project.category}" href="${REPORT_PAGE}?id=${encodeURIComponent(project.id)}">
        <div class="project-card-top">
          <span class="project-badge">${escapeHtml(category.label)}</span>
          ${project.example ? `<span class="project-example">Example</span>` : ""}
          <span class="project-year">${escapeHtml(project.year || "")}</span>
        </div>

        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary)}</p>

        ${methods ? `<ul class="project-methods">${methods}</ul>` : ""}

        <div class="project-card-foot">
          <span class="project-tools">${escapeHtml((project.tools || []).join(" · "))}</span>
          <span class="project-cta">Read report <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </div>`;
}

function renderProjects() {
  const groups = Object.entries(manifest.categories)
    .filter(([key]) => state.category === "all" || state.category === key)
    .map(([key, category]) => {
      const all = manifest.projects.filter((p) => p.category === key);
      const shown = all.filter((p) => !state.method || p.methods.includes(state.method));

      const body = shown.length
        ? `<div class="row g-4">${shown.map(projectCard).join("")}</div>`
        : `<p class="hub-empty">No ${category.label.toLowerCase()} projects ${state.method ? "use this method yet" : "yet"}.</p>`;

      return `
        <section class="project-group project-group-${key}">
          <div class="group-head">
            <div>
              <h2>${escapeHtml(category.label)}</h2>
              <p>${escapeHtml(category.description)}</p>
            </div>
            <span class="group-count">${shown.length === all.length ? plural(all.length, "project") : `${shown.length} of ${all.length}`}</span>
          </div>
          ${body}
        </section>`;
    });

  document.getElementById("project-groups").innerHTML = groups.join("");
}

function renderMethodGroups() {
  document.getElementById("method-groups").innerHTML = manifest.methodGroups.map((group) => `
    <div class="col-lg-3 col-md-6">
      <div class="method-group">
        <h3>${escapeHtml(group.label)}</h3>
        <ul>
          ${group.methods.map((method) => {
            const count = projectsUsing(method.id).length;
            return `
              <li>
                <button type="button" class="method-row ${state.method === method.id ? "is-active" : ""}"
                        data-method="${method.id}" ${count ? "" : "disabled"}>
                  <span class="method-row-text">
                    <strong>${escapeHtml(method.name)}</strong>
                    <small>${escapeHtml(method.detail || "")}</small>
                  </span>
                  <span class="method-count">${count ? plural(count, "project") : "In practice"}</span>
                </button>
              </li>`;
          }).join("")}
        </ul>
      </div>
    </div>`).join("");
}

function render() {
  renderCategoryButtons();
  renderMethodChips();
  renderProjects();
  renderMethodGroups();
}


// ----- Events -----

function bindEvents() {
  document.querySelector(".segmented").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (button) setState({ category: button.dataset.category });
  });

  document.getElementById("method-chips").addEventListener("click", (event) => {
    const chip = event.target.closest("button[data-method]");
    if (!chip) return;
    const method = chip.dataset.method || null;
    setState({ method: state.method === method ? null : method });
  });

  document.getElementById("method-groups").addEventListener("click", (event) => {
    const row = event.target.closest("button[data-method]");
    if (!row || row.disabled) return;
    setState({ method: row.dataset.method, category: "all" });
    document.getElementById("projects").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}


async function initDataHub() {
  try {
    const response = await fetch(MANIFEST_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    manifest = await response.json();
  } catch (error) {
    console.error("Could not load projects:", error);
    document.getElementById("project-groups").innerHTML =
      "<p class='hub-empty'>Projects could not be loaded. Please run the website using a local web server.</p>";
    return;
  }

  manifest.methodGroups.forEach((group) => {
    group.methods.forEach((method) => { methodsById[method.id] = method; });
  });

  readStateFromUrl();
  renderStats();
  render();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", initDataHub);
