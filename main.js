/* =============================================================
   Mac Chat — main.js
   
   HOW IT WORKS:
   ─────────────────────────────────────────────────────────────
   1. REAL VIDEOS: Each video has a YouTube video ID. When you
      click a card, it builds a real YouTube embed URL:
        https://www.youtube.com/embed/{VIDEO_ID}?autoplay=1
      This plays the actual YouTube video inside an <iframe>.
   
   2. REAL THUMBNAILS: YouTube provides public thumbnail images
      at https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg
      — no API key needed.
   
   3. METADATA (title, author): Fetched from noembed.com, a free
      public oEmbed proxy that reads YouTube's own oEmbed API.
      This is how sites like Reddit/Slack show link previews.
   
   4. ADDING VIDEOS: You paste any YouTube URL. The app extracts
      the video ID, fetches metadata from noembed, and saves the
      video to localStorage so it persists across refreshes.
   
   5. SEARCH: Searches titles and channel names of loaded videos.
   
   6. STORAGE: All videos are stored in localStorage under the
      key "macchat_videos". Pre-loaded with real YouTube IDs.
   ============================================================= */

'use strict';

// ─────────────────────────────────────────────
//  STORAGE KEY
// ─────────────────────────────────────────────
const STORE_KEY = 'macchat_videos';

// ─────────────────────────────────────────────
//  PRE-LOADED VIDEOS  (real YouTube video IDs)
//  Add more by pasting YouTube URLs via "Add Video"
// ─────────────────────────────────────────────
const DEFAULT_VIDEOS = [
  // Tech
  { id: 'dQw4w9WgXcQ',  cat: 'music',     title: 'Rick Astley – Never Gonna Give You Up',          author: 'Rick Astley' },
  { id: 'LXb3EKWsInQ',  cat: 'gaming',    title: 'Minecraft Speedrun World Record',                 author: 'Dream' },
  { id: 'JGwWNGJdvx8',  cat: 'music',     title: 'Ed Sheeran – Shape of You',                      author: 'Ed Sheeran' },
  { id: 'kJQP7kiw5Fk',  cat: 'music',     title: 'Luis Fonsi – Despacito ft. Daddy Yankee',        author: 'Luis Fonsi' },
  { id: 'OPf0YbXqDm0',  cat: 'music',     title: 'Mark Ronson – Uptown Funk ft. Bruno Mars',       author: 'Mark Ronson' },
  { id: 'hT_nvWreIhg',  cat: 'education', title: 'How does the stock market work? – Oliver Elfenbaum', author: 'TED-Ed' },
  { id: 'Ke90Tje7VS0',  cat: 'education', title: 'Elon Musk: The future we\'re building -- and boring', author: 'TED' },
  { id: 'X3paOmcrTjQ',  cat: 'tech',      title: 'I Ranked Every AI Coding Tool',                  author: 'Fireship' },
  { id: 'aircAruvnKk',  cat: 'tech',      title: 'But what is a neural network? — Deep Learning Ch 1', author: '3Blue1Brown' },
  { id: 'WXuK6gekU1Y',  cat: 'music',     title: 'Beethoven – Moonlight Sonata (Full)',             author: 'Paul Barton' },
  { id: 'l482T0yNkeo',  cat: 'education', title: 'The Entire History of the World in 19 Minutes',  author: 'Geo History' },
  { id: 'M7lc1UVf-VE',  cat: 'education', title: 'How Does the Internet Actually Work?',            author: 'Lesics' },
  { id: '6nUMCeAYndc',  cat: 'vlog',      title: 'Exploring Japan\'s Hidden Countryside',          author: 'Solo Traveler' },
  { id: 'ZSt9tm3RoUU',  cat: 'comedy',    title: 'Best of SNL Cold Open 2024',                     author: 'SNL' },
  { id: 'ysz5S6PUM-U',  cat: 'music',     title: 'Pharrell Williams – Happy (Official Music Video)', author: 'Pharrell Williams' },
  { id: 'H7jtC8vjXw8',  cat: 'sports',    title: 'Cristiano Ronaldo – 10 Impossible Goals',        author: 'Skills & Goals' },
  { id: 'aBr2kKAHN6M',  cat: 'education', title: 'How to Learn Anything Fast – Feynman Technique', author: 'Thomas Frank' },
  { id: 'e_04ZrNroTo',  cat: 'tech',      title: '100 Days of Code – What I Learned',              author: 'CS Dojo' },
  { id: 'tgbNymZ7vqY',  cat: 'gaming',    title: 'The Finals – Tips and Tricks for Beginners',     author: 'TroubleChute' },
  { id: 'sNUDMDEFHqQ',  cat: 'shorts',    title: 'The World\'s Largest Gummy Bear',                author: 'MrBeast Shorts' },
  { id: 'bNkDeUApreo',  cat: 'news',      title: 'How Climate Change is Reshaping Our World',       author: 'Vox' },
  { id: 'C7FMmg_ZHGY',  cat: 'vlog',      title: '24 Hours in Tokyo – Full Vlog',                  author: 'Yes Theory' },
  { id: 'hHW1oY26kxQ',  cat: 'comedy',    title: 'Rowan Atkinson Live – Fatal Beatings',           author: 'Rowan Atkinson' },
  { id: '2Vv-BfVoq4g',  cat: 'music',     title: 'Ed Sheeran – Perfect (Official Music Video)',    author: 'Ed Sheeran' },
  { id: 'OBmlCZTF4Xs',  cat: 'sports',    title: 'Top 50 NBA Plays of 2023-24',                    author: 'NBA' },
  { id: 'lI77z6a19zA',  cat: 'gaming',    title: 'Grand Theft Auto VI – Everything We Know',       author: 'MrBossFTW' },
  { id: 'UF8uR6Z6KLc',  cat: 'education', title: 'Steve Jobs Stanford Commencement 2005',          author: 'Stanford University' },
  { id: 'yR0lWiGSMoQ',  cat: 'tech',      title: 'Python vs JavaScript – Which to Learn First?',  author: 'Bro Code' },
  { id: 'jNQXAC9IVRw',  cat: 'vlog',      title: 'Me at the Zoo (First YouTube Video Ever)',       author: 'jawed' },
  { id: '9bZkp7q19f0',  cat: 'music',     title: 'PSY – GANGNAM STYLE (Official Music Video)',     author: 'officialpsy' },
];

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let videos = [];          // all stored videos
let visibleCount = 18;    // cards shown on home
const PAGE_SIZE = 12;
let activeCat = 'all';
let activeSearchQuery = '';
let currentPlayingId = null;  // for remove button
let selectedAddCat = 'all';

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

function ytThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function ytEmbed(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

function ytUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function extractVideoId(input) {
  input = input.trim();
  // youtu.be/ID
  let m = input.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // youtube.com/watch?v=ID or /shorts/ID or /embed/ID or /live/ID
  m = input.match(/(?:v=|\/(?:shorts|embed|live|v)\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  return null;
}

function showToast(msg, dur = 2400) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(videos));
  } catch (e) {}
}

function initVideos() {
  const stored = loadFromStorage();
  if (stored && stored.length > 0) {
    videos = stored;
  } else {
    // First visit: use defaults (thumbnails are public, metadata pre-filled)
    videos = DEFAULT_VIDEOS.map(v => ({ ...v }));
    saveToStorage();
  }
}

// ─────────────────────────────────────────────
//  noembed — fetch real title + author
// ─────────────────────────────────────────────
async function fetchMeta(videoId) {
  try {
    const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('noembed error');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      title: data.title || 'YouTube Video',
      author: data.author_name || 'Unknown Channel',
    };
  } catch (e) {
    return { title: 'YouTube Video', author: 'YouTube' };
  }
}

// ─────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────
function filteredVideos() {
  if (activeCat === 'all') return videos;
  return videos.filter(v => v.cat === activeCat);
}

function cardHTML(v) {
  return `
    <div class="video-card" data-vid="${v.id}" tabindex="0" role="button" aria-label="${v.title}">
      <div class="video-card__thumb">
        <img
          src="${ytThumb(v.id)}"
          alt="${v.title}"
          loading="lazy"
          onerror="this.src='https://img.youtube.com/vi/${v.id}/mqdefault.jpg'"
        />
        <div class="play-btn"><i class="fas fa-play"></i></div>
        ${v.cat && v.cat !== 'all'
          ? `<span class="video-card__cat">${v.cat}</span>`
          : ''}
      </div>
      <div class="video-card__body">
        <div class="video-card__title">${v.title}</div>
        <div class="video-card__channel">
          <i class="fab fa-youtube"></i>
          ${v.author || 'YouTube'}
        </div>
      </div>
    </div>`;
}

function skeletonHTML() {
  return `
    <div class="video-card skeleton-card" style="pointer-events:none">
      <div class="video-card__thumb"></div>
      <div class="video-card__body">
        <div class="skel h14 w80" style="margin-bottom:8px"></div>
        <div class="skel h11 w50"></div>
      </div>
    </div>`;
}

function emptyHTML(msg) {
  return `<div class="empty-state"><i class="fas fa-film"></i><p>${msg}</p></div>`;
}

function renderGrid() {
  const grid = $('videoGrid');
  const lmBtn = $('loadMoreBtn');
  const list = filteredVideos();
  const slice = list.slice(0, visibleCount);

  if (slice.length === 0) {
    grid.innerHTML = emptyHTML('No videos in this category yet. Add one!');
    lmBtn.style.display = 'none';
    return;
  }

  grid.innerHTML = slice.map(cardHTML).join('');
  lmBtn.style.display = visibleCount < list.length ? 'block' : 'none';
  bindCardClicks(grid);
}

function renderSearchResults(query) {
  const q = query.toLowerCase();
  const matches = videos.filter(v =>
    v.title.toLowerCase().includes(q) ||
    (v.author || '').toLowerCase().includes(q) ||
    v.cat.toLowerCase().includes(q) ||
    v.id === query.trim()
  );

  $('searchLabel').innerHTML = `Showing results for <strong>"${query}"</strong> — ${matches.length} video${matches.length !== 1 ? 's' : ''}`;
  const grid = $('searchGrid');
  grid.innerHTML = matches.length
    ? matches.map(cardHTML).join('')
    : emptyHTML(`No results for "${query}"`);
  bindCardClicks(grid);
}

function bindCardClicks(container) {
  container.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => openPlayer(card.dataset.vid));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openPlayer(card.dataset.vid);
    });
  });
}

// ─────────────────────────────────────────────
//  PLAYER MODAL
// ─────────────────────────────────────────────
function openPlayer(videoId) {
  const v = videos.find(x => x.id === videoId);
  if (!v) return;

  currentPlayingId = videoId;

  $('playerIframe').src = ytEmbed(videoId);
  $('playerTitle').textContent = v.title;
  $('playerChannel').textContent = v.author || 'YouTube';
  $('ytLink').href = ytUrl(videoId);

  $('playerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePlayer() {
  $('playerIframe').src = '';   // stops video
  $('playerOverlay').classList.remove('open');
  document.body.style.overflow = '';
  currentPlayingId = null;
}

// ─────────────────────────────────────────────
//  ADD VIDEO MODAL
// ─────────────────────────────────────────────
function openAddModal() {
  $('addUrlInput').value = '';
  $('addStatus').textContent = '';
  $('addStatus').className = 'add-modal__status';
  $('addOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('addUrlInput').focus(), 100);
}

function closeAddModal() {
  $('addOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitAdd() {
  const raw = $('addUrlInput').value.trim();
  const statusEl = $('addStatus');
  const btn = $('addSubmitBtn');

  if (!raw) {
    statusEl.textContent = 'Please paste a YouTube URL first.';
    statusEl.className = 'add-modal__status err';
    return;
  }

  const videoId = extractVideoId(raw);
  if (!videoId) {
    statusEl.textContent = 'Could not find a valid YouTube video ID in that URL.';
    statusEl.className = 'add-modal__status err';
    return;
  }

  // Already exists?
  if (videos.some(v => v.id === videoId)) {
    statusEl.textContent = 'That video is already in Mac Chat!';
    statusEl.className = 'add-modal__status err';
    return;
  }

  btn.disabled = true;
  statusEl.textContent = 'Fetching video info from YouTube…';
  statusEl.className = 'add-modal__status';

  const meta = await fetchMeta(videoId);

  const newVid = {
    id: videoId,
    cat: selectedAddCat,
    title: meta.title,
    author: meta.author,
  };

  videos.unshift(newVid);    // add to top
  saveToStorage();
  visibleCount = Math.max(visibleCount, PAGE_SIZE);

  statusEl.textContent = `✓ Added "${meta.title}"`;
  statusEl.className = 'add-modal__status ok';
  btn.disabled = false;
  $('addUrlInput').value = '';

  // Re-render
  activeSearchQuery = '';
  activeCat = 'all';
  syncChips();
  showHome();
  renderGrid();

  setTimeout(closeAddModal, 1200);
  showToast(`Added: ${meta.title}`);
}

// ─────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────
function doSearch() {
  const q = $('searchInput').value.trim();
  if (!q) return clearSearch();

  // Is it a YouTube URL? → add it
  const vid = extractVideoId(q);
  if (vid && q.includes('youtube') || q.includes('youtu.be')) {
    $('addUrlInput').value = q;
    openAddModal();
    return;
  }

  activeSearchQuery = q;
  $('clearBtn').style.display = 'flex';
  $('chipsBar').style.display = 'none';
  $('gridWrap').style.display = 'none';
  $('searchResults').style.display = 'block';
  renderSearchResults(q);
}

function clearSearch() {
  activeSearchQuery = '';
  $('searchInput').value = '';
  $('clearBtn').style.display = 'none';
  $('chipsBar').style.display = 'flex';
  showHome();
}

function showHome() {
  $('gridWrap').style.display = 'block';
  $('searchResults').style.display = 'none';
  renderGrid();
}

// ─────────────────────────────────────────────
//  CHIPS
// ─────────────────────────────────────────────
function syncChips() {
  document.querySelectorAll('.chip[data-cat]').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === activeCat);
  });
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initVideos();
  renderGrid();

  // Brand / home link
  $('brandLink').addEventListener('click', e => {
    e.preventDefault();
    clearSearch();
  });

  // Chips
  document.querySelectorAll('.chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeCat = chip.dataset.cat;
      visibleCount = PAGE_SIZE;
      syncChips();
      clearSearch();
    });
  });

  // Load more
  $('loadMoreBtn').addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderGrid();
  });

  // Search input
  $('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') clearSearch();
  });
  $('searchInput').addEventListener('input', () => {
    $('clearBtn').style.display = $('searchInput').value ? 'flex' : 'none';
    if (!$('searchInput').value) clearSearch();
  });
  $('searchBtn').addEventListener('click', doSearch);
  $('clearBtn').addEventListener('click', clearSearch);

  // Add video modal
  $('addBtn').addEventListener('click', openAddModal);
  $('closeAdd').addEventListener('click', closeAddModal);
  $('addSubmitBtn').addEventListener('click', submitAdd);
  $('addUrlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAdd();
    if (e.key === 'Escape') closeAddModal();
  });

  // Add cat chips
  document.querySelectorAll('.chip[data-addcat]').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedAddCat = chip.dataset.addcat;
      document.querySelectorAll('.chip[data-addcat]').forEach(c =>
        c.classList.toggle('active', c.dataset.addcat === selectedAddCat));
    });
  });

  // Player modal
  $('closePlayer').addEventListener('click', closePlayer);
  $('playerOverlay').addEventListener('click', e => {
    if (e.target === $('playerOverlay')) closePlayer();
  });

  // Copy link
  $('copyLinkBtn').addEventListener('click', () => {
    if (!currentPlayingId) return;
    navigator.clipboard.writeText(ytUrl(currentPlayingId))
      .then(() => showToast('YouTube link copied!'))
      .catch(() => showToast('Copy failed — try manually'));
  });

  // Remove video
  $('removeBtn').addEventListener('click', () => {
    if (!currentPlayingId) return;
    const v = videos.find(x => x.id === currentPlayingId);
    videos = videos.filter(x => x.id !== currentPlayingId);
    saveToStorage();
    closePlayer();
    renderGrid();
    showToast(`Removed "${v?.title || 'video'}"`);
  });

  // Close modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('playerOverlay').classList.contains('open')) closePlayer();
      if ($('addOverlay').classList.contains('open')) closeAddModal();
    }
  });
});