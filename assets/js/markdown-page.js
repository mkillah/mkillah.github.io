// Loads the Markdown file named in data-src into the element and renders it.
// Usage: <div class="markdown-content" data-src="content/page.md"></div>

async function loadMarkdownPage() {
  const container = document.querySelector("[data-src]");
  if (!container) return;

  try {
    const response = await fetch(container.dataset.src, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    container.innerHTML = marked.parse(await response.text());
  } catch (error) {
    console.error("Could not load page content:", error);
    container.innerHTML =
      "<p>Content could not be loaded. Please run the website using a local web server.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadMarkdownPage);
