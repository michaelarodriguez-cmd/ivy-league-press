
(() => {
  const pageCache = new Map();

  function isInternalPage(url) {
    return (
      url.origin === location.origin &&
      /\.html$/.test(url.pathname)
    );
  }

  async function loadPage(url) {
    const key = url.pathname;

    if (pageCache.has(key)) {
      return pageCache.get(key);
    }

    const response = await fetch(key);

    if (!response.ok) {
      throw new Error('Page could not be loaded');
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(
      html,
      'text/html'
    );

    if (!doc.querySelector('main')) {
      throw new Error('Page content is missing');
    }

    pageCache.set(key, html);
    return html;
  }

  let navigationNumber = 0;

  async function navigate(url, addHistory = true) {
    const requestNumber = ++navigationNumber;
    const main = document.querySelector('main');

    if (!main) {
      location.href = url.href;
      return;
    }

    try {
      const html = await loadPage(url);

      if (requestNumber !== navigationNumber) return;

      const doc = new DOMParser().parseFromString(
        html,
        'text/html'
      );

      const newMain = doc.querySelector('main');
      const newDialog = doc.querySelector('#storyDialog');

      if (!newMain) {
        location.href = url.href;
        return;
      }

      // Preserve the header, navigation and footer.
      main.replaceWith(document.importNode(newMain, true));

      // Replace the homepage story dialog when necessary.
      document.querySelector('#storyDialog')?.remove();

      if (newDialog) {
        document.body.appendChild(
          document.importNode(newDialog, true)
        );
      }

      if (addHistory) {
        history.pushState({}, '', url.href);
      }

      document.title = doc.title;

      // Update the active navigation item.
      document.querySelectorAll('nav a').forEach(link => {
        const linkURL = new URL(link.href, location.href);

        const active =
          linkURL.pathname === url.pathname &&
          linkURL.search === url.search;

        link.classList.toggle('active', active);

        if (active) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      // Close the mobile menu.
      const nav = document.querySelector('#nav');
      const menu = document.querySelector('#menu');

      nav?.classList.remove('open');
      menu?.setAttribute('aria-expanded', 'false');

      // Notify page-specific code to initialize new content.
      document.dispatchEvent(
        new CustomEvent('ilp:pagechange')
      );

      if (url.hash) {
        document.getElementById(
          decodeURIComponent(url.hash.slice(1))
        )?.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }

    } catch (error) {
      console.error('Navigation error:', error);

      // Fall back to normal navigation if loading fails.
      location.href = url.href;
    }
  }

  document.addEventListener('click', event => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link = event.target.closest('a[href]');
    if (!link) return;

    if (
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    ) return;

    const url = new URL(link.href, location.href);

    if (!isInternalPage(url)) return;

    event.preventDefault();

    navigate(url);
  });

  window.addEventListener('popstate', () => {
    const url = new URL(location.href);

    if (isInternalPage(url)) {
      navigate(url, false);
    }
  });

  // Prepare commonly visited pages in the background.
  window.addEventListener('load', () => {
    [
      'index.html',
      'section.html',
      'search.html',
      'about.html',
      'standards.html',
      'contact.html',
      'article.html'
    ].forEach(path => {
      loadPage(new URL(path, location.href)).catch(() => {});
    });
  });
})();
