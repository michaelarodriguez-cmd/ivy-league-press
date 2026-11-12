
(() => {
  const $ = s => document.querySelector(s);

  const esc = s => String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

  const categories = ['Investigations', 'Politics', 'Government'];
  let articles = [];

  const card = a => `
    <div class="article-tile">
      <small>${esc(a.category)} · DEMONSTRATION</small>
      <h2>
        <a href="article.html?slug=${encodeURIComponent(a.slug)}">
          ${esc(a.title)}
        </a>
      </h2>
      <p>${esc(a.excerpt)}</p>
      <a href="article.html?slug=${encodeURIComponent(a.slug)}">
        READ SAMPLE →
      </a>
    </div>
  `;

  function renderSection() {
    const results = $('#section-results');
    if (!results) return;

    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const heading = categories.includes(category)
      ? category
      : 'All Coverage';

    const title = $('#section-title');
    if (title) title.textContent = heading;

    document.title = heading + ' | Ivy League Press';

    const filtered = articles.filter(a =>
      !categories.includes(category) || a.category === category
    );

    results.innerHTML = filtered.map(card).join('') ||
      '<p>No demonstration articles in this section yet.</p>';

    // Highlight the selected navigation link.
    document.querySelectorAll('nav a').forEach(link => {
      const url = new URL(link.href, location.href);
      const active =
        url.pathname.endsWith('/section.html') &&
        url.searchParams.get('category') === category;

      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Switch categories without reloading the whole page.
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !$('#section-results')) return;

    const url = new URL(link.href, location.href);

    if (
      url.origin !== location.origin ||
      !url.pathname.endsWith('/section.html')
    ) return;

    event.preventDefault();
    history.pushState({}, '', url.pathname + url.search);
    renderSection();
  });

  window.addEventListener('popstate', () => {
    if ($('#section-results')) renderSection();
  });

  fetch('articles.json')
    .then(response => {
      if (!response.ok) throw new Error('Article data unavailable');
      return response.json();
    })
    .then(data => {
      articles = data;

      if ($('#section-results')) renderSection();

      if ($('#article-content')) {
        const slug = new URLSearchParams(location.search).get('slug');
        const a = articles.find(x => x.slug === slug);

        $('#article-content').innerHTML = a
          ? `
            <div class="story-flag">
              ${esc(a.category)} · DEMONSTRATION · NOT REAL NEWS
            </div>
            <h1>${esc(a.title)}</h1>
            <p class="lead">${esc(a.excerpt)}</p>
            <p class="story-meta">${esc(a.author)} · ${esc(a.date)}</p>
            <div class="alert">
              This article is a fictional demonstration for layout
              testing, not an actual investigation.
            </div>
            <div class="story-body">
              ${(a.body || []).map(x => `<p>${esc(x)}</p>`).join('')}
            </div>
            <p><a href="index.html">← Back to homepage</a></p>
          `
          : '<h1>Article not found</h1>';
      }

      if ($('#query')) {
        const update = () => {
          const q = $('#query').value.toLowerCase();

          $('#search-results').innerHTML =
            articles.filter(a =>
              [a.title, a.category, a.excerpt]
                .join(' ')
                .toLowerCase()
                .includes(q)
            ).map(card).join('') || '<p>No matching stories.</p>';
        };

        $('#query').addEventListener('input', update);
        update();
      }
    })
    .catch(() => {
      for (const id of [
        '#section-results',
        '#article-content',
        '#search-results'
      ]) {
        if ($(id)) {
          $(id).innerHTML = '<p>Unable to load articles.json.</p>';
        }
      }
    });

  // Preserve the existing article draft export feature.
  $('#draft-form')?.addEventListener('submit', event => {
    event.preventDefault();

    const f = new FormData(event.target);
    const title = String(f.get('title')).trim();

    const a = {
      slug: title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      title,
      category: f.get('category'),
      excerpt: f.get('excerpt'),
      date: new Date().toISOString().slice(0, 10),
      author: f.get('author'),
      body: String(f.get('body'))
        .split(/\n\s*\n/)
        .filter(Boolean)
    };

    const u = URL.createObjectURL(
      new Blob([JSON.stringify(a, null, 2)], {
        type: 'application/json'
      })
    );

    const link = document.createElement('a');
    link.href = u;
    link.download = a.slug + '.json';
    link.click();

    setTimeout(() => URL.revokeObjectURL(u), 1000);
  });
})();
