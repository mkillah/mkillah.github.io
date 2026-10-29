// Business analysis page: tab groups (click or arrow keys).
//   #ba-views   page view: Analysis report / Requirements Verifier (synced with #verifier in the URL)
//   #wf-viewer  wireframe viewer
//   #rv-tabs    verifier result tabs

function initTabs(container, onSelect) {
  if (!container) return null;
  const tabs = [...container.querySelectorAll('[role="tab"]')];

  function select(tab, focus = false) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) tab.focus();
    if (onSelect) onSelect(tab);
  }

  container.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });

  container.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    if (event.key === "ArrowRight") select(tabs[(index + 1) % tabs.length], true);
    if (event.key === "ArrowLeft") select(tabs[(index - 1 + tabs.length) % tabs.length], true);
  });

  return { tabs, select };
}

function initPageViews() {
  const views = initTabs(document.getElementById("ba-views"), (tab) => {
    const hash = tab.id === "view-tab-verifier" ? "#verifier" : "";
    if (location.hash !== hash && (hash || location.hash === "#verifier")) {
      history.replaceState(null, "", location.pathname + location.search + hash);
    }
  });
  if (!views) return;

  const verifierTab = document.getElementById("view-tab-verifier");
  const analysisTab = document.getElementById("view-tab-analysis");
  const fromHash = () => {
    if (location.hash === "#verifier") views.select(verifierTab);
    else if (document.getElementById(location.hash.slice(1))?.closest("#view-analysis")) views.select(analysisTab);
  };
  fromHash();
  // In-page links to #verifier (e.g. from the Requirements deliverable) switch view and jump to the top of it.
  window.addEventListener("hashchange", () => {
    fromHash();
    if (location.hash === "#verifier") document.getElementById("ba-views").scrollIntoView({ block: "start" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs(document.getElementById("wf-viewer"));
  initTabs(document.getElementById("rv-tabs"));
  initPageViews();
});
