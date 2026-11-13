import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these two placeholders with your own Supabase values.
const SUPABASE_URL = 'https://kdbmbgygqxaareaiavuj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_udopPnk7YpqGTqrSMfQ2_Q_DDWoAYoe';

const $ = id => document.getElementById(id);
const isLogin = Boolean($('login-form'));
const isDashboard = Boolean($('dashboard'));
const message = text => { if ($('message')) $('message').textContent = text; };

if (SUPABASE_URL.includes('PASTE_') || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')) {
  message('Configure your Supabase URL and publishable key in newsroom.js first.');
  if ($('loading')) $('loading').textContent = 'Supabase configuration required.';
} else {
  const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storageKey: 'ivy-league-press-auth',
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
  const loginURL = 'newsroom-login.html';
  const dashboardURL = 'newsroom-dashboard.html';
  const { data: { session } } = await supabase.auth.getSession();

  if (isLogin) {
    if (session) {
      const { data, error } = await supabase.rpc('is_editor');
      if (!error && data === true) location.replace(dashboardURL);
    }
    $('login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('login-form').querySelector('button');
      button.disabled = true;
      message('Signing in…');
      const { error } = await supabase.auth.signInWithPassword({
        email: $('email').value.trim(), password: $('password').value
      });
      if (error) { message(error.message); button.disabled = false; return; }
      const result = await supabase.rpc('is_editor');
      if (result.error || result.data !== true) {
        await supabase.auth.signOut();
        message('This account does not have editor access.');
        button.disabled = false;
        return;
      }
      location.replace(dashboardURL);
    });
  }

  if (isDashboard) {
    if (!session) location.replace(loginURL);
    else {
      const { data: allowed, error } = await supabase.rpc('is_editor');
      if (error || allowed !== true) {
        await supabase.auth.signOut();
        location.replace(loginURL);
      } else {
        $('loading').hidden = true;
        $('dashboard').hidden = false;
        let selected = null;
        let currentSources = [];
        let currentStatus = 'draft';
        let savedSnapshot = '';
        const fields = ['title','slug','category','excerpt','body','author'];
        const snapshot = () => JSON.stringify(fields.map(id => $(id).value));
        const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const collect = () => Object.fromEntries(fields.map(id => [id, $(id).value.trim()]));
        const ensureSaved = () => {
          if (!selected) { message('Save the draft first.'); return false; }
          if (snapshot() !== savedSnapshot) { message('Save your changes before approving or publishing.'); return false; }
          return true;
        };
        const renderSources = () => {
          $('source-list').innerHTML = currentSources.map(s => `<li><a href="${escapeHTML(s.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.source_name)}</a></li>`).join('');
        };
        const loadSources = async () => {
          if (!selected) { currentSources = []; renderSources(); return; }
          const { data, error } = await supabase.from('article_sources').select('id,source_name,source_url').eq('article_id', selected);
          if (error) { message(error.message); return; }
          currentSources = data || [];
          renderSources();
        };
        const choose = async article => {
          selected = article?.id ?? null;
          currentStatus = article?.status ?? 'draft';
          $('article-id').value = selected || '';
          for (const id of fields) $(id).value = article?.[id] ?? (id === 'category' ? 'Investigations' : id === 'author' ? 'Ivy League Press' : '');
          savedSnapshot = snapshot();
          $('editor-title').textContent = selected ? `Edit article · ${currentStatus}` : 'New draft';
          $('approve').disabled = !selected || currentStatus === 'published';
          $('publish').disabled = !selected || currentStatus !== 'approved';
          await loadSources();
        };
        const loadArticles = async (keepSelected = true) => {
          const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
          if (error) { message(error.message); return; }
          $('article-list').replaceChildren();
          for (const article of data || []) {
            const button = document.createElement('button');
            button.className = 'article-item' + (selected === article.id ? ' selected' : '');
            button.textContent = article.title;
            const small = document.createElement('small');
            small.textContent = `${article.category} · ${article.status}`;
            button.appendChild(small);
            button.addEventListener('click', () => choose(article));
            $('article-list').appendChild(button);
          }
          if (keepSelected && selected) {
            const current = (data || []).find(a => a.id === selected);
            if (current) await choose(current);
          }
        };
        $('new-article').addEventListener('click', () => choose(null));
        $('title').addEventListener('input', () => {
          if (selected || $('slug').value) return;
          $('slug').value = $('title').value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        });
        $('article-form').addEventListener('submit', async event => {
          event.preventDefault();
          const article = collect();
          if (!article.title || !article.slug || !article.body) return;
          if (selected && currentStatus === 'published') { message('Published articles cannot be edited in this starter dashboard.'); return; }
          const operation = selected
            ? supabase.from('articles').update({ ...article, status: 'draft' }).eq('id', selected).select().single()
            : supabase.from('articles').insert({ ...article, status: 'draft' }).select().single();
          const { data, error } = await operation;
          if (error) { message(error.message); return; }
          selected = data.id;
          currentStatus = 'draft';
          savedSnapshot = snapshot();
          message('Draft saved.');
          await loadArticles();
        });
        $('source-form').addEventListener('submit', async event => {
          event.preventDefault();
          if (!ensureSaved()) return;
          const url = $('source-url').value.trim();
          if (!/^https?:\/\//i.test(url)) { message('Enter a valid HTTP or HTTPS source URL.'); return; }
          const { error } = await supabase.from('article_sources').insert({
            article_id: selected, source_name: $('source-name').value.trim(), source_url: url
          });
          if (error) { message(error.message); return; }
          $('source-form').reset();
          message('Source added.');
          await loadSources();
        });
        $('approve').addEventListener('click', async () => {
          if (!ensureSaved()) return;
          if (!currentSources.length) { message('Add at least one source before approving.'); return; }
          if (!confirm('Have you independently verified all claims, quotations, and source links? Approve this article?')) return;
          const { error } = await supabase.from('articles').update({ status: 'approved' }).eq('id', selected);
          if (error) { message(error.message); return; }
          currentStatus = 'approved';
          message('Article approved. Not yet published.');
          await loadArticles();
        });
        $('publish').addEventListener('click', async () => {
          if (!ensureSaved() || currentStatus !== 'approved') return;
          if (!confirm('Publish this approved article? It will become publicly readable through Supabase.')) return;
          const { error } = await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', selected).eq('status', 'approved');
          if (error) { message(error.message); return; }
          currentStatus = 'published';
          message('Article published to the database. Public website integration comes next.');
          await loadArticles();
        });
        $('sign-out').addEventListener('click', async () => {
          await supabase.auth.signOut();
          location.replace(loginURL);
        });
        
        // IVY LEAGUE PRESS — MONITORED NEWS & AI DRAFTING

        const newsPanel = document.createElement('section');
        newsPanel.id = 'monitored-news-panel';
        newsPanel.style.cssText = `
          margin: 24px 0;
          padding: 20px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
        `;

        newsPanel.innerHTML = `
          <h2>Monitored News</h2>
          <p>
            Headlines collected from your news sources.
            Generate a preliminary AI draft for editorial review.
          </p>
          <button type="button" id="refresh-news">
            Refresh headlines
          </button>
          <p id="news-status" role="status"></p>
          <div id="monitored-news-list"></div>
        `;

        // Place the news panel inside the existing dashboard.
        $('dashboard').prepend(newsPanel);

        const newsStatus = $('news-status');
        const newsList = $('monitored-news-list');
        const refreshNewsButton = $('refresh-news');

        async function loadMonitoredNews() {
          newsStatus.textContent = 'Loading monitored news…';
          refreshNewsButton.disabled = true;

          const { data, error } = await supabase
            .from('news_stories')
            .select('id,headline,source_name,source_url,category,discovered_at')
            .order('discovered_at', { ascending: false })
            .limit(30);

          refreshNewsButton.disabled = false;

          if (error) {
            newsStatus.textContent =
              'Unable to load headlines: ' + error.message;
            return;
          }

          newsList.replaceChildren();

          if (!data?.length) {
            newsStatus.textContent =
              'No monitored headlines available yet.';
            return;
          }

          newsStatus.textContent =
            `${data.length} recent headlines loaded.`;

          for (const story of data) {
            const item = document.createElement('div');
            item.style.cssText = `
              padding: 14px 0;
              border-bottom: 1px solid #d1d5db;
            `;

            const headline = document.createElement('strong');
            headline.textContent = story.headline;
            headline.style.display = 'block';

            const details = document.createElement('p');
            details.textContent =
              `${story.source_name} · ${story.category || 'News'}`;
            details.style.margin = '6px 0';

            const sourceLink = document.createElement('a');
            sourceLink.href = story.source_url;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.textContent = 'Read original source';
            sourceLink.style.display = 'inline-block';
            sourceLink.style.marginRight = '14px';

            const draftButton = document.createElement('button');
            draftButton.type = 'button';
            draftButton.textContent = 'Generate AI Draft';

            draftButton.addEventListener('click', async () => {
              const confirmed = confirm(
                `Generate a preliminary AI draft for:\n\n` +
                `${story.headline}\n\n` +
                `This uses the OpenAI API and may incur charges. ` +
                `The draft will require fact-checking before approval.`
              );

              if (!confirmed) return;

              draftButton.disabled = true;
              draftButton.textContent = 'Generating…';
              newsStatus.textContent =
                'AI is generating a preliminary draft. Please wait.';

              try {
                const { data: authData, error: authError } =
                  await supabase.auth.getSession();

                if (authError || !authData.session) {
                  throw new Error(
                    'Your login session expired. Please sign in again.'
                  );
                }

                const { data: result, error } =
                  await supabase.functions.invoke('draft-article', {
                    body: { story_id: story.id }
                  });

                if (error) {
                  let detail = error.message;

                  if (error.context instanceof Response) {
                    const body = await error.context
                      .json()
                      .catch(() => null);

                    if (body?.error) {
                      detail = body.error +
                        (body.upstream_status
                          ? ` (HTTP ${body.upstream_status})`
                          : '');
                    }
                  }

                  throw new Error(detail);
                }

                if (!result?.success || !result.article?.id) {
                  throw new Error(
                    result?.error || 'Draft generation did not complete.'
                  );
                }

                // Reload the existing article list.
                await loadArticles(false);

                // Open the newly created draft in the editor.
                const { data: article, error: articleError } =
                  await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', result.article.id)
                    .single();

                if (articleError || !article) {
                  throw new Error(
                    'Draft saved, but the editor could not load it.'
                  );
                }

                await choose(article);

                newsStatus.textContent =
                  'AI draft created successfully. ' +
                  'Review and verify all claims before approving.';

                message(
                  'AI draft saved. It has NOT been published.'
                );

                $('article-form').scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });

              } catch (error) {
                console.error('AI drafting error:', error);

                newsStatus.textContent =
                  'Draft generation failed: ' + error.message;

                message(
                  'AI drafting failed: ' + error.message
                );
              } finally {
                draftButton.disabled = false;
                draftButton.textContent = 'Generate AI Draft';
              }
            });

            item.append(
              headline,
              details,
              sourceLink,
              draftButton
            );

            newsList.appendChild(item);
          }
        }

        refreshNewsButton.addEventListener(
          'click',
          loadMonitoredNews
        );

        await loadMonitoredNews();

        // END MONITORED NEWS SECTION

        await choose(null);
        await loadArticles(false);
      }
    }
  }
}
