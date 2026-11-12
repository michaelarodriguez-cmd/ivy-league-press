
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://kdbmbgygqxaareaiavuj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_udopPnk7YpqGTqrSMfQ2_Q_DDWoAYoe';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function createArticleCard(article) {
  const card = document.createElement('article');
  card.className = 'story';

  const body = document.createElement('div');
  body.className = 'story-body';

  const category = document.createElement('div');
  category.className = 'demo';
  category.textContent = article.category || 'News';

  const title = document.createElement('h3');
  title.textContent = article.title;

  const excerpt = document.createElement('p');
  excerpt.textContent = article.excerpt || '';

  const link = document.createElement('a');
  link.className = 'read';
  link.href = `article.html?slug=${encodeURIComponent(article.slug)}`;
  link.textContent = 'READ ARTICLE →';

  body.append(category, title, excerpt, link);
  card.appendChild(body);

  return card;
}

async function loadPublishedArticles() {
  const container = document.getElementById('published-articles');
  if (!container) return;

  const { data, error } = await supabase
    .from('articles')
    .select('title,slug,category,excerpt,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  if (!container.isConnected) return;

  container.replaceChildren();

  if (error) {
    const notice = document.createElement('p');
    notice.textContent = 'Published articles are temporarily unavailable.';
    container.appendChild(notice);
    console.error('Error loading articles:', error);
    return;
  }

  if (!data?.length) {
    const notice = document.createElement('p');
    notice.textContent = 'Our first published stories are coming soon.';
    container.appendChild(notice);
    return;
  }

  for (const article of data) {
    container.appendChild(createArticleCard(article));
  }
}

document.addEventListener('ilp:pagechange', loadPublishedArticles);
loadPublishedArticles();
