# Marko Antolcic — Portfolio

A responsive personal portfolio built with HTML, CSS, JavaScript, and Bootstrap 5. It is designed to work as a static website on GitHub Pages.

## Run in PyCharm

1. Extract this folder and open it as a project in PyCharm.
2. Open `run_local.py` and click **Run**.
3. The site opens at `http://127.0.0.1:8000`.

Python is used for the local preview server. The published website itself is static HTML/CSS/JavaScript, which is compatible with GitHub Pages; GitHub Pages does not run a Flask/Python backend.

## Publish with GitHub Pages

1. Create a GitHub repository, e.g. `portfolio`.
2. Upload all files and folders in this project to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Wait for the published URL shown in Settings → Pages.

For a personal URL like `https://mkillah.github.io`, name the repository exactly `mkillah.github.io`.

## Customize

- Edit your text in the HTML files.
- Add projects and links in the relevant topic pages.
- Change colors and layout in `assets/css/style.css`.
- Update the GitHub, ResearchGate, and LinkedIn links in the footer.
- Bootstrap and Google Fonts are loaded from CDNs, so those visual assets require an internet connection.
