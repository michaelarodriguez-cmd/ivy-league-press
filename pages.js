
(() => {
  const $ = selector => document.querySelector(selector);

  const categories = [
    'Investigations',
    'Politics',
    'Government'
  ];

  let articles = [];
  let articlesLoaded = false;

  const escapeHTML = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  function getPageType(path = location.pathname) {
    if (path.endsWith('/section.html')) return 'section';
    if (path.endsWith('/search.html')) return 'search';
    return null;
  }

  function articleCard(article) {
    return `
      <div class="article-tile">
        <small>
          ${escapeHTML(article.category)} · DEMONSTRATION
        </small>

        <h2>
          <a href="article.html?slug=${encodeURIComponent(article.slug)}">
            ${escapeHTML(article.title)}
          </a>
        </h2>

        <p>${escapeHTML(article.excerpt)}</p>

        <a href="article.html?slug=${encodeURIComponent(article.slug)}">
          READ SAMPLE →
        </a>
      </div>
    `;
  }

  function getCategory() {
    return new URLSearchParams(location.search).get('category');
  }

  function updateNavigation() {
    const currentPage = getPageType();
    const category = getCategory();

    document.querySelectorAll('nav a').forEach(link => {
      const url = new URL(link.href, location.href);
      const linkPage = getPageType(url.pathname);

      const active =
        currentPage === 'search'
          ? linkPage === 'search'
          : currentPage === 'section' &&
            linkPage === 'section' &&
            url.searchParams.get('category') === category;

      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function renderSection() {
    const title = $('#section-title');
    const results = $('#section-results');

    if (!title || !results) return;

    const category = getCategory();

    const heading = categories.includes(category)
      ? category
      : 'All Coverage';

    title.textContent = heading;
    document.title = heading + ' | Ivy League Press';

    if (!articlesLoaded) {
      results.innerHTML = '<p>Loading articles...</p>';
      return;
    }

    const filtered = articles.filter(article =>
      !categories.includes(category) ||
      article.category === category
    );

    results.innerHTML = filtered.length
      ? filtered.map(articleCard).join('')
      : '<p>No demonstration articles in this section yet.</p>';
  }

  function renderSearch() {
    const input = $('#query');
    const results = $('#search-results');

    if (!input || !results) return;

    if (!articlesLoaded) {
      results.innerHTML = '<p>Loading articles...</p>';
      return;
    }

    const term = input.value.trim().toLowerCase();

    const filtered = articles.filter(article =>
      [
        article.title,
        article.category,
        article.excerpt
      ].join(' ').toLowerCase().includes(term)
    );

    results.innerHTML = filtered.length
      ? filtered.map(articleCard).join('')
      : '<p>No matching stories.</p>';
  }

  function renderArticle() {
    const container = $('#article-content');
    if (!container) return;

    const slug = new URLSearchParams(location.search).get('slug');
    const article = articles.find(item => item.slug === slug);

    if (!article) {
      container.innerHTML = '<h1>Article not found</h1>';
      return;
    }

    container.innerHTML = `
      <div class="story-flag">
        ${escapeHTML(article.category)}
        · DEMONSTRATION · NOT REAL NEWS
      </div>

      <h1>${escapeHTML(article.title)}</h1>

      <p class="lead">${escapeHTML(article.excerpt)}</p>

      <p class="story-meta">
        ${escapeHTML(article.author)}
        · ${escapeHTML(article.date)}
      </p>

      <div class="alert">
        This article is a fictional demonstration for
        layout testing, not an actual investigation.
      </div>

      <div class="story-body">
        ${(article.body || []).map(paragraph =>
          `<p>${escapeHTML(paragraph)}</p>`
        ).join('')}
      </div>

      <p><a href="index.html">← Back to homepage</a></p>
    `;
  }

  function sectionMarkup() {
    return `
      <div class="label">IVY LEAGUE PRESS | NEWS</div>
      <h1 id="section-title"></h1>
      <p class="lead">Browse demonstration stories by topic.</p>

      <div class="alert">
        All stories are fictional demonstrations,
        not published news.
      </div>

      <div class="article-grid" id="section-results"></div>
    `;
  }

  function searchMarkup() {
    return `
      <h1>Search the newsroom</h1>

      <p class="lead">
        Search launch-preview demonstration articles.
      </p>

      <input
        id="query"
        type="search"
        placeholder="Search headlines, topics and summaries"
        aria-label="Search articles"
      >

      <div class="article-grid" id="search-results"></div>
    `;
  }

  function renderPage() {
    const page = getPageType();
    const main = $('main');

    if (!main || !page) return;

    main.classList.add('interior');

    if (page === 'section') {
      if (!$('#section-results')) {
        main.innerHTML = sectionMarkup();
      }
      renderSection();
    }

    if (page === 'search') {
      if (!$('#search-results')) {
        main.innerHTML = searchMarkup();
      }
      document.title = 'Search | Ivy League Press';
      renderSearch();
    }

    updateNavigation();
  }

  // Smooth navigation between categories and Search.
 

    const link = event.target.closest('a[href]');
    if (!link) return;

    if (link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) return;

    const url = new URL(link.href, location.href);
    const destination = getPageType(url.pathname);
    const current = getPageType();

    if (!destination || !current ||
        url.origin !== location.origin) return;

    event.preventDefault();

    const nextURL = url.pathname + url.search;

    if (nextURL !== location.pathname + location.search) {
      history.pushState({}, '', nextURL);
    }

    renderPage();
    window.scrollTo(0, 0);

    if (destination === 'search') {
      $('#query')?.focus({ preventScroll: true });
    }
  });

  // Support the browser Back and Forward buttons.
  

  // Search input updates without reloading.
  document.addEventListener('input', event => {
    if (event.target.id === 'query') {
      renderSearch();
    }
  });

  // Load demonstration articles once.
  fetch('articles.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to load articles');
      }
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error('Invalid article data');
      }

      articles = data;
      articlesLoaded = true;

      if (getPageType()) renderPage();
      if ($('#article-content')) renderArticle();
    })
    .catch(error => {
      console.error(error);

      for (const id of [
        '#section-results',
        '#search-results',
        '#article-content'
      ]) {
        const element = $(id);
        if (element) {
          element.innerHTML =
            '<p>Unable to load articles.json.</p>';
        }
      }
    });

  // Preserve article draft exporting.
  $('#draft-form')?.addEventListener('submit', event => {
    event.preventDefault();

    const form = new FormData(event.target);
    const title = String(form.get('title') ?? '').trim();

    if (!title) return;

    const article = {
      slug: title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      title,
      category: form.get('category'),
      excerpt: form.get('excerpt'),
      date: new Date().toISOString().slice(0, 10),
      author: form.get('author'),
      body: String(form.get('body') ?? '')
        .split(/\n\s*\n/)
        .filter(Boolean)
    };

    const blob = new Blob(
      [JSON.stringify(article, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const download = document.createElement('a');

    download.href = url;
    download.download = article.slug + '.json';
    download.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Initialize the current page.
  renderPage();
document.addEventListener('ilp:pagechange', () => {
  renderPage();

  if ($('#article-content') && articlesLoaded) {
    renderArticle();
  }
});
})();
