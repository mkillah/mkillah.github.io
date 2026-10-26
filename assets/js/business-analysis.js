// Business analysis page: tabbed wireframe viewer (click or arrow keys).

function initWireframeViewer() {
  const viewer = document.getElementById("wf-viewer");
  if (!viewer) return;

  const tabs = [...viewer.querySelectorAll('[role="tab"]')];

  function select(tab, focus = false) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) tab.focus();
  }

  viewer.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });

  viewer.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    if (event.key === "ArrowRight") select(tabs[(index + 1) % tabs.length], true);
    if (event.key === "ArrowLeft") select(tabs[(index - 1 + tabs.length) % tabs.length], true);
  });
}

document.addEventListener("DOMContentLoaded", initWireframeViewer);
