# Ivy League Press — expanded website

All current stories are explicitly fictional demonstrations.

## Update your existing GitHub + Vercel site

Download and unzip the package. Upload **all files and the assets folder contents** to the root of your existing `ivy-league-press` GitHub repository. Replace `index.html`, `styles.css`, `script.js` with the supplied versions. Keep the additional HTML, `pages.css`, `pages.js`, `articles.json`, and assets in their respective locations. Commit to `main`; your existing Vercel project will deploy automatically. Do not upload the ZIP itself to GitHub.

## Pages

- `index.html`: current homepage with navigation to new pages
- `section.html`: Investigations / Politics / Government
- `article.html`: article view
- `search.html`: article search
- `about.html`, `standards.html`, `contact.html`: newsroom information
- `editor.html`: public local draft JSON export tool; **not private or authenticated**
- `articles.json`: demonstration article content

## Publish later

Use the editor to download an article record. After editorial verification, append its object to the JSON array in `articles.json` and commit. This is a manual publishing workflow, not a secure CMS. To publish from a private dashboard, configure a CMS and authentication separately. Do not submit sensitive news tips through ordinary email. Check brand/trademark and domain availability before wider launch.
