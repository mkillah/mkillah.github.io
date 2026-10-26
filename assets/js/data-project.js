// Project report page: data-project.html?id=<project-id> (or nlp-project.html, ...)
// Looks the project up in projects.json (only listed projects can load),
// shows its details, renders its Markdown report, and links to the
// previous and next projects.
//
// Configured on <main id="project-page">:
//   data-projects-dir  folder with projects.json and the .md reports
//   data-hub-page      hub page that lists all projects

const pageConfig = document.getElementById("project-page")?.dataset || {};
const PROJECTS_DIR = pageConfig.projectsDir || "content/data-projects/";
const HUB_PAGE = pageConfig.hubPage || "data-analysis-and-statistics.html";
const REPORT_PAGE = window.location.pathname.split("/").pop() || "data-project.html";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showMessage(html) {
  document.getElementById("project-content").innerHTML = html;
}

async function initProjectPage() {
  const id = new URLSearchParams(window.location.search).get("id");

  let manifest;
  try {
    const response = await fetch(`${PROJECTS_DIR}projects.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    manifest = await response.json();
  } catch (error) {
    console.error("Could not load projects:", error);
    showMessage("<p>Project could not be loaded. Please run the website using a local web server.</p>");
    return;
  }

  const projects = manifest.projects;
  const index = projects.findIndex((project) => project.id === id);

  if (index === -1) {
    showMessage(`<h1>Project not found</h1><p>This project does not exist. <a href="${HUB_PAGE}">See all projects</a>.</p>`);
    return;
  }

  const project = projects[index];
  const category = manifest.categories[project.category];
  const methodsById = {};
  manifest.methodGroups.forEach((group) => group.methods.forEach((m) => { methodsById[m.id] = m; }));

  document.title = `${project.title} | Marko Antolcic`;
  // Professional reports use the blue accent, academic ones the default green
  const page = document.getElementById("project-page");
  page.classList.add(`project-${project.category}`);
  if (project.category === "professional") page.classList.add("accent-blue");

  // Details strip above the report
  const methodLinks = project.methods
    .filter((methodId) => methodsById[methodId])
    .map((methodId) => `<a href="${HUB_PAGE}?method=${encodeURIComponent(methodId)}#projects">${escapeHtml(methodsById[methodId].name)}</a>`)
    .join("");

  // Optional link to the code (only https links are allowed)
  const codeLink = /^https:\/\//.test(project.repo || "")
    ? `<div><dt>Code</dt><dd><a href="${escapeHtml(project.repo)}" target="_blank" rel="noopener noreferrer">View on GitHub ↗</a></dd></div>`
    : "";

  // Optional link to more details, e.g. a published thesis: { "label": "...", "url": "https://..." }
  const details = project.details || {};
  const detailsLink = /^https:\/\//.test(details.url || "")
    ? `<div><dt>Details</dt><dd><a href="${escapeHtml(details.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(details.label || "Read more")} ↗</a></dd></div>`
    : "";

  document.getElementById("project-meta").innerHTML = `
    <div class="project-card-top">
      <a class="project-badge" href="${HUB_PAGE}?category=${encodeURIComponent(project.category)}#projects">${escapeHtml(category.label)}</a>
      ${project.example ? `<span class="project-example">Example</span>` : ""}
      <span class="project-year">${escapeHtml(project.year || "")}</span>
    </div>
    <dl class="project-facts">
      <div><dt>Methods</dt><dd class="project-methods">${methodLinks}</dd></div>
      <div><dt>Tools</dt><dd>${escapeHtml((project.tools || []).join(" · "))}</dd></div>
      ${codeLink}
      ${detailsLink}
    </dl>`;

  // Report
  try {
    const response = await fetch(`${PROJECTS_DIR}${encodeURIComponent(project.id)}.md`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    showMessage(marked.parse(await response.text()));
  } catch (error) {
    console.error("Could not load report:", error);
    showMessage(`<h1>${escapeHtml(project.title)}</h1><p>The report for this project could not be loaded.</p>`);
  }

  // Previous and next projects
  const link = (p, label, cls) => p ? `
    <a class="project-pager-link ${cls}" href="${REPORT_PAGE}?id=${encodeURIComponent(p.id)}">
      <small>${label}</small>
      <strong>${escapeHtml(p.title)}</strong>
    </a>` : "<span></span>";

  document.getElementById("project-pager").innerHTML =
    link(projects[index - 1], "← Previous project", "is-prev") +
    link(projects[index + 1], "Next project →", "is-next");
}

document.addEventListener("DOMContentLoaded", initProjectPage);
