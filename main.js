/* ================================================================
   Mac Chat v3 — main.js

   HOW IT WORKS:
   ───────────────────────────────────────────────────────────────
   • YouTube Data API v3 (google's official API — free, no login)
     Your API key is stored in localStorage. Every search/browse
     call hits:
       https://www.googleapis.com/youtube/v3/search
     with your key. This returns real videos from ALL of YouTube.

   • Thumbnails & embeds come directly from YouTube's CDN.

   • Shorts: searched with keyword "#shorts" and displayed in a
     TikTok-style vertical scroll with snap-scrolling. Infinite
     scroll loads more as you reach the bottom.

   • Pagination: prev/next page using YouTube's pageToken system.

   QUOTA: Each search call costs 100 units. Free tier = 10,000/day
   = ~100 searches per day. More than enough for personal use.
   ================================================================ */

'use strict';

// ─────────────────────────────────────────────────────
//  CONFIG & STATE
// ─────────────────────────────────────────────────────
const API_KEY_STORAGE = 'macchat_yt_api_key';
const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';

let API_KEY = '';
let currentView = 'home';        // home | shorts | search
let currentQuery = '';           // last search query
let pageTokens = [''];           // stack of page tokens; index = page number
let currentPage = 0;
let shortNextToken = '';
let shortItems = [];             // loaded short video objects
let shortPage = 0;               // how many batches loaded
let loadingShorts = false;

// ─────────────────────────────────────────────────────
//  DOM
// ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const gateOverlay   = $('gateOverlay');
const appEl         = $('app');
const searchInput   = $('searchInput');
const searchClear   = $('searchClear');
const videoGrid     = $('videoGrid');
const videosView    = $('videosView');
const shortsView    = $('shortsView');
const shortsContainer = $('shortsContainer');
const sectionTitle  = $('sectionTitle');
const pagination    = $('pagination');
const prevBtn       = $('prevBtn');
const nextBtn       = $('nextBtn');
const pageInfo      = $('pageInfo');
const playerOverlay = $('playerOverlay');
const playerIframe  = $('playerIframe');
const playerTitle   = $('playerTitle');
const playerChannel = $('playerChannel');
const ytOpenLink    = $('ytOpenLink');

// ─────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────
function toast(msg, dur = 2500) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function ytEmbed(id, autoplay = true) {
  return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0`;
}
function ytUrl(id) { return `https://www.youtube.com/watch?v=${id}`; }
function ytThumb(id) { return `https://img.youtube.com/vi/${id}/mqdefault.jpg`; }

function skeletonGrid(n = 12) {
  return Array.from({ length: n }, () => `
    <div class="vcard skel-card" style="pointer-events:none">
      <div class="vcard-thumb"></div>
      <div class="vcard-body">
        <div class="skel h13 w80" style="margin-bottom:9px"></div>
        <div class="skel h10 w55"></div>
      </div>
    </div>`).join('');
}

function setNavActive(name) {
  document.querySelectorAll('.side-item[data-nav]').forEach(el =>
    el.classList.toggle('active', el.dataset.nav === name));
}

// ─────────────────────────────────────────────────────
//  API KEY GATE
// ─────────────────────────────────────────────────────
function initGate() {
  const saved = localStorage.getItem(API_KEY_STORAGE);
  if (saved) {
    API_KEY = saved;
    launchApp();
    return;
  }

  gateOverlay.style.display = 'flex';
  appEl.style.display = 'none';

  $('gateSubmit').addEventListener('click', submitKey);
  $('apiKeyInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitKey(); });
}

async function submitKey() {
  const val = $('apiKeyInput').value.trim();
  if (!val) return;
  // Quick validation test
  try {
    const res = await fetch(`${YT_SEARCH}?part=snippet&q=test&maxResults=1&key=${val}`);
    const data = await res.json();
    if (data.error) {
      $('apiKeyInput').style.borderColor = 'var(--red)';
      alert('Invalid API key: ' + data.error.message);
      return;
    }
    API_KEY = val;
    localStorage.setItem(API_KEY_STORAGE, API_KEY);
    launchApp();
  } catch (e) {
    alert('Network error. Check your connection.');
  }
}

function launchApp() {
  gateOverlay.style.display = 'none';
  appEl.style.display = 'flex';
  loadHome();
}

// ─────────────────────────────────────────────────────
//  YOUTUBE API CALLS
// ─────────────────────────────────────────────────────

/**
 * Core search function.
 * type: 'video' | 'video,channel' 
 * extraParams: object of extra query params
 */
async function ytSearch({ query, maxResults = 20, pageToken = '', type = 'video', extraParams = {} }) {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    maxResults,
    type,
    key: API_KEY,
    ...(pageToken ? { pageToken } : {}),
    ...extraParams,
  });
  const res = await fetch(`${YT_SEARCH}?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

/**
 * Get full video details (for duration etc) — costs 1 unit per call
 */
async function ytVideoDetails(ids) {
  if (!ids.length) return [];
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
    key: API_KEY,
  });
  const res = await fetch(`${YT_VIDEOS}?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.items || [];
}

// ─────────────────────────────────────────────────────
//  VIEWS
// ─────────────────────────────────────────────────────

function showVideosView() {
  videosView.style.display = 'block';
  shortsView.style.display = 'none';
}

function showShortsView() {
  videosView.style.display = 'none';
  shortsView.style.display = 'block';
}

// ── HOME ──────────────────────────────────────────────
async function loadHome() {
  currentView = 'home';
  currentQuery = '';
  pageTokens = [''];
  currentPage = 0;
  setNavActive('home');
  showVideosView();
  searchInput.value = '';
  searchClear.style.display = 'none';
  sectionTitle.style.display = 'none';
  await fetchAndRenderVideos('trending videos 2024', '');
}

// ── SEARCH ────────────────────────────────────────────
async function doSearch(q) {
  if (!q.trim()) return;
  currentView = 'search';
  currentQuery = q.trim();
  pageTokens = [''];
  currentPage = 0;
  setNavActive('');
  showVideosView();
  sectionTitle.innerHTML = `<i class="fas fa-search"></i> Results for "${q}"`;
  sectionTitle.style.display = 'flex';
  await fetchAndRenderVideos(q, '');
}

// ── CATEGORY ──────────────────────────────────────────
const NAV_QUERIES = {
  trending:  { q: 'trending 2024', icon: 'fas fa-fire',      label: 'Trending' },
  music:     { q: 'music official music video 2024', icon: 'fas fa-music', label: 'Music' },
  gaming:    { q: 'gaming gameplay 2024', icon: 'fas fa-gamepad', label: 'Gaming' },
  news:      { q: 'world news today', icon: 'fas fa-newspaper', label: 'News' },
  sports:    { q: 'sports highlights 2024', icon: 'fas fa-futbol', label: 'Sports' },
  tech:      { q: 'technology review 2024', icon: 'fas fa-microchip', label: 'Tech' },
};

async function loadCategory(nav) {
  const cfg = NAV_QUERIES[nav];
  if (!cfg) return;
  currentView = 'category';
  currentQuery = cfg.q;
  pageTokens = [''];
  currentPage = 0;
  setNavActive(nav);
  showVideosView();
  sectionTitle.innerHTML = `<i class="${cfg.icon}"></i> ${cfg.label}`;
  sectionTitle.style.display = 'flex';
  await fetchAndRenderVideos(cfg.q, '');
}

// ── FETCH & RENDER VIDEOS ─────────────────────────────
async function fetchAndRenderVideos(query, pageToken) {
  videoGrid.innerHTML = skeletonGrid(12);
  pagination.style.display = 'none';

  try {
    const data = await ytSearch({
      query,
      maxResults: 20,
      pageToken,
      type: 'video',
      extraParams: { safeSearch: 'moderate' },
    });

    const items = (data.items || []).filter(i => i.id?.videoId);
    if (!items.length) {
      videoGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-search"></i><p>No results found for "${query}".</p>
      </div>`;
      return;
    }

    // Store next page token
    if (data.nextPageToken) {
      if (pageTokens.length <= currentPage + 1) pageTokens.push(data.nextPageToken);
      else pageTokens[currentPage + 1] = data.nextPageToken;
    }

    videoGrid.innerHTML = items.map(item => {
      const vid = item.id.videoId;
      const snip = item.snippet;
      const title = snip.title;
      const channel = snip.channelTitle;
      const thumb = snip.thumbnails?.medium?.url || ytThumb(vid);
      return `
        <div class="vcard" data-vid="${vid}" data-title="${escAttr(title)}" data-channel="${escAttr(channel)}" tabindex="0" role="button">
          <div class="vcard-thumb">
            <img src="${thumb}" alt="${escAttr(title)}" loading="lazy"/>
            <div class="vcard-play"><i class="fas fa-play"></i></div>
          </div>
          <div class="vcard-body">
            <div class="vcard-title">${escHtml(title)}</div>
            <div class="vcard-channel"><i class="fab fa-youtube"></i> ${escHtml(channel)}</div>
          </div>
        </div>`;
    }).join('');

    bindCardClicks();

    // Pagination
    const hasPrev = currentPage > 0;
    const hasNext = !!data.nextPageToken;
    if (hasPrev || hasNext) {
      pagination.style.display = 'flex';
      prevBtn.disabled = !hasPrev;
      nextBtn.disabled = !hasNext;
      pageInfo.textContent = `Page ${currentPage + 1}`;
    }

  } catch (err) {
    videoGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-exclamation-triangle"></i>
      <p>API error: ${escHtml(err.message)}<br/>
      <a href="#" onclick="resetApiKey()">Reset API key</a></p>
    </div>`;
  }
}

// ── SHORTS ────────────────────────────────────────────
async function loadShorts() {
  currentView = 'shorts';
  setNavActive('shorts');
  showShortsView();
  shortsContainer.innerHTML = '';
  shortItems = [];
  shortNextToken = '';
  shortPage = 0;
  loadingShorts = false;
  await fetchMoreShorts();
  setupShortsInfiniteScroll();
}

async function fetchMoreShorts() {
  if (loadingShorts) return;
  loadingShorts = true;

  try {
    const data = await ytSearch({
      query: '#shorts',
      maxResults: 10,
      pageToken: shortNextToken,
      type: 'video',
      extraParams: {
        videoDuration: 'short',
        safeSearch: 'moderate',
      },
    });

    shortNextToken = data.nextPageToken || '';
    const items = (data.items || []).filter(i => i.id?.videoId);
    shortItems.push(...items);

    items.forEach((item, idx) => {
      const vid = item.id.videoId;
      const snip = item.snippet;
      const slide = document.createElement('div');
      slide.className = 'short-slide';
      slide.dataset.vid = vid;

      slide.innerHTML = `
        <div class="short-iframe-wrap">
          <iframe
            src="https://www.youtube.com/embed/${vid}?autoplay=${idx === 0 && shortPage === 0 ? 1 : 0}&loop=1&playlist=${vid}&rel=0&modestbranding=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="short-bottom-info">
          <div class="short-title">${escHtml(snip.title)}</div>
          <div class="short-channel">${escHtml(snip.channelTitle)}</div>
        </div>
        <div class="short-nav-arrows">
          <button class="short-nav-btn short-up" title="Previous"><i class="fas fa-chevron-up"></i></button>
          <button class="short-nav-btn short-down" title="Next"><i class="fas fa-chevron-down"></i></button>
        </div>`;

      slide.querySelector('.short-up').addEventListener('click', () => scrollShort(-1, slide));
      slide.querySelector('.short-down').addEventListener('click', () => scrollShort(1, slide));

      shortsContainer.appendChild(slide);
    });

    shortPage++;
  } catch (e) {
    console.error('Shorts load error:', e);
  } finally {
    loadingShorts = false;
  }
}

function scrollShort(dir, currentSlide) {
  const slides = [...shortsContainer.querySelectorAll('.short-slide')];
  const idx = slides.indexOf(currentSlide);
  const target = slides[idx + dir];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

function setupShortsInfiniteScroll() {
  // Load more when user scrolls near the end
  shortsContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = shortsContainer;
    if (scrollHeight - scrollTop - clientHeight < clientHeight * 1.5) {
      fetchMoreShorts();
    }
  });
}

// ─────────────────────────────────────────────────────
//  PLAYER
// ─────────────────────────────────────────────────────
function openPlayer(vid, title, channel) {
  playerIframe.src = ytEmbed(vid);
  playerTitle.textContent = title;
  playerChannel.textContent = channel;
  ytOpenLink.href = ytUrl(vid);
  playerOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  $('copyBtn').onclick = () => {
    navigator.clipboard.writeText(ytUrl(vid))
      .then(() => toast('Link copied!'))
      .catch(() => toast('Could not copy'));
  };
}

function closePlayer() {
  playerIframe.src = '';
  playerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────────────
//  CARD CLICK BINDING
// ─────────────────────────────────────────────────────
function bindCardClicks() {
  document.querySelectorAll('.vcard').forEach(card => {
    card.onclick = () => openPlayer(card.dataset.vid, card.dataset.title, card.dataset.channel);
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') openPlayer(card.dataset.vid, card.dataset.title, card.dataset.channel); };
  });
}

// ─────────────────────────────────────────────────────
//  ESCAPE HELPERS
// ─────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────
//  API KEY RESET
// ─────────────────────────────────────────────────────
function resetApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
  API_KEY = '';
  appEl.style.display = 'none';
  gateOverlay.style.display = 'flex';
  $('apiKeyInput').value = '';
}
window.resetApiKey = resetApiKey;

// ─────────────────────────────────────────────────────
//  MAIN INIT
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  initGate();

  // Search — press Enter only (no button)
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      doSearch(searchInput.value.trim());
    }
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchClear.style.display = 'none';
      if (currentView === 'search') loadHome();
    }
  });
  searchInput.addEventListener('input', () => {
    searchClear.style.display = searchInput.value ? 'flex' : 'none';
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    if (currentView === 'search') loadHome();
  });

  // Sidebar nav
  document.querySelectorAll('.side-item[data-nav]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const nav = item.dataset.nav;
      if (nav === 'home') loadHome();
      else if (nav === 'shorts') loadShorts();
      else loadCategory(nav);
    });
  });

  // Sidebar toggle
  $('sidebarToggle').addEventListener('click', () => {
    const sb = $('sidebar');
    if (window.innerWidth <= 680) {
      sb.classList.toggle('mobile-open');
    } else {
      sb.classList.toggle('collapsed');
    }
  });

  // Brand = home
  $('brandLink').addEventListener('click', e => { e.preventDefault(); loadHome(); });

  // API key reset buttons
  [$('apiResetBtn'), $('sideChangeKey')].forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); resetApiKey(); });
  });

  // Pagination
  prevBtn.addEventListener('click', async () => {
    if (currentPage <= 0) return;
    currentPage--;
    const token = pageTokens[currentPage] || '';
    const query = currentQuery || 'trending videos 2024';
    await fetchAndRenderVideos(query, token);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('mainContent').scrollTo({ top: 0, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', async () => {
    const nextToken = pageTokens[currentPage + 1];
    if (!nextToken) return;
    currentPage++;
    const query = currentQuery || 'trending videos 2024';
    await fetchAndRenderVideos(query, nextToken);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('mainContent').scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Player close
  $('closePlayer').addEventListener('click', closePlayer);
  playerOverlay.addEventListener('click', e => { if (e.target === playerOverlay) closePlayer(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePlayer();
  });

});