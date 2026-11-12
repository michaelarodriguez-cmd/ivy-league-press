
(() => {
  const $ = selector => document.querySelector(selector);

  const SUPABASE_URL = 'https://kdbmbgygqxaareaiavuj.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_udopPnk7YpqGTqrSMfQ2_Q_DDWoAYoe';

  const categories = ['Investigations', 'Politics', 'Government'];

  let articles = [];
  let articlesLoaded = false;
  let loadError = false;

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
    if (path.endsWith('/article.html')) return 'article';
    return null;
  }

  function getCategory() {
    return new URLSearchParams(location.search).get('category');
  }

  function articleCard(article) {
    const demo = article.isDemo;

    return `
      <div class="article-tile">
        <small>
          ${escapeHTML(article.category)}
          ${demo ? ' · DEMONSTRATION' : ' · PUBLISHED NEWS'}
        </small>

        <h2>
          <a href="article.html?slug=${encodeURIComponent(article.slug)}">
            ${escapeHTML(article.title)}
          </a>
        </h2>

        <p>${escapeHTML(article.excerpt || '')}</p>

        <a href="article.html?slug=${encodeURIComponent(article.slug)}">
          ${demo ? 'READ SAMPLE' : 'READ ARTICLE'} →
        </a>
      </div>
    `;
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

  function sectionMarkup() {
    return `
      <div class="label">IVY LEAGUE PRESS | NEWS</div>
      <h1 id="section-title"></h1>
      <p class="lead">
        Browse published reporting and clearly labeled
        demonstration articles by topic.
      </p>
      <div class="article-grid" id="section-results"></div>
    `;
  }

  function searchMarkup() {
    return `
      <h1>Search the newsroom</h1>
      <p class="lead">
        Search published reporting and demonstration articles.
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
      : '<p>No stories in this section yet.</p>';
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

    if (!articlesLoaded) {
      container.innerHTML = '<p>Loading article...</p>';
      return;
    }

    const slug = new URLSearchParams(location.search).get('slug');
    const article = articles.find(item => item.slug === slug);

    if (!article) {
      container.innerHTML = '<h1>Article not found</h1>';
      document.title = 'Article not found | Ivy League Press';
      return;
    }

    document.title = article.title + ' | Ivy League Press';

    const demo = article.isDemo;

    const paragraphs = Array.isArray(article.body)
      ? article.body
      : String(article.body || '')
          .split(/\n\s*\n/)
          .filter(Boolean);

    const date = article.date
      ? new Date(article.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC'
        })
      : '';

    container.innerHTML = `
      <div class="story-flag">
        ${escapeHTML(article.category)}
        · ${demo
          ? 'DEMONSTRATION · NOT REAL NEWS'
          : 'PUBLISHED REPORTING'}
      </div>

      <h1>${escapeHTML(article.title)}</h1>

      <p class="lead">${escapeHTML(article.excerpt || '')}</p>

      <p class="story-meta">
        ${escapeHTML(article.author || 'Ivy League Press')}
        ${date ? ' · ' + escapeHTML(date) : ''}
      </p>

      ${demo ? `
        <div class="alert">
          This article is a fictional demonstration for
          layout testing, not an actual investigation.
        </div>
      ` : ''}

      <div class="story-body">
        ${paragraphs.map(paragraph =>
          `<p>${escapeHTML(paragraph).replace(/\n/g, '<br>')}</p>`
        ).join('')}
      </div>

      <p><a href="index.html">← Back to homepage</a></p>
    `;
  }

  function renderPage() {
    const page = getPageType();
    const main = $('main');

    if (!main || !page) {
      updateNavigation();
      return;
    }

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

    if (page === 'article') {
      renderArticle();
    }

    updateNavigation();
  }

  // Preserve live search without reloading the page.
  document.addEventListener('input', event => {
    if (event.target.id === 'query') {
      renderSearch();
    }
  });

  // Preserve the existing article draft export feature.
  document.addEventListener('submit', event => {
    if (event.target.id !== 'draft-form') return;

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

  async function loadArticles() {
    let demoArticles = [];
    let publishedArticles = [];

    try {
      const response = await fetch('articles.json');
      if (!response.ok) throw new Error('Unable to load articles.json');

      const data = await response.json();

      if (Array.isArray(data)) {
        demoArticles = data.map(article => ({
          ...article,
          isDemo: true
        }));
      }
    } catch (error) {
      console.error('Demonstration articles:', error);
    }

    try {
      const { createClient } = await import(
        'https://esm.sh/@supabase/supabase-js@2'
      );

      const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

      const { data, error } = await supabase
        .from('articles')
        .select(
          'title,slug,category,excerpt,body,author,published_at'
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      publishedArticles = (data || []).map(article => ({
        ...article,
        date: article.published_at,
        isDemo: false
      }));
    } catch (error) {
      console.error('Published articles:', error);
      loadError = true;
    }

    // Published stories take priority if slugs overlap.
    const publishedSlugs = new Set(
      publishedArticles.map(article => article.slug)
    );

    articles = [
      ...publishedArticles,
      ...demoArticles.filter(
        article => !publishedSlugs.has(article.slug)
      )
    ];

    articlesLoaded = true;
    renderPage();

    if (loadError) {
      console.warn(
        'Some published articles may be unavailable.'
      );
    }
  }

  // Keep the existing flicker-free navigation.
  document.addEventListener('ilp:pagechange', () => {
    renderPage();
  });

  renderPage();
  loadArticles();
})();
