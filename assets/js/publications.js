
async function loadPublications() {
  const container = document.getElementById("publication-content");

  try {
    const response = await fetch("content/publications.md", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const markdown = await response.text();

    container.innerHTML = marked.parse(markdown);
  } catch (error) {
    console.error("Could not load publications:", error);

    container.innerHTML = `
      <p class="text-danger">
        Publications could not be loaded.
        Please try again later.
      </p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadPublications);