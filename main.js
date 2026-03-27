/* ================================================
   ViewTube — main.js
   Handles data, rendering, search, modal, nav
   ================================================ */

'use strict';

// ══════════════════════════════════════════════
//  DATA  (mock YouTube-style content)
// ══════════════════════════════════════════════

const AVATAR_COLORS = [
  '#e53935','#d81b60','#8e24aa','#3949ab',
  '#1e88e5','#00897b','#43a047','#f4511e',
  '#fb8c00','#fdd835'
];

function avatarColor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const CHANNELS = [
  { id: 'ch1', name: 'TechPulse', subs: '4.2M', desc: 'Latest in tech, gadgets, and AI breakthroughs.', verified: true },
  { id: 'ch2', name: 'LoFi Vibes', subs: '8.1M', desc: 'Chill beats to study and relax to.', verified: true },
  { id: 'ch3', name: 'GameCraft', subs: '2.7M', desc: 'Deep dives into games, reviews, and Let\'s Plays.', verified: false },
  { id: 'ch4', name: 'WorldNews24', subs: '12M', desc: 'Breaking news around the globe, 24/7.', verified: true },
  { id: 'ch5', name: 'CookLab', subs: '1.9M', desc: 'Science-based cooking experiments and recipes.', verified: false },
  { id: 'ch6', name: 'TrailBlazer', subs: '980K', desc: 'Outdoor adventures, hiking, and travel vlogs.', verified: false },
  { id: 'ch7', name: 'CodeFlow', subs: '3.3M', desc: 'Programming tutorials and software architecture.', verified: true },
  { id: 'ch8', name: 'FitFusion', subs: '5.6M', desc: 'Workouts, nutrition, and healthy living.', verified: true },
];

const VIDEOS = [
  { id: 'v1', title: 'GPT-5 Just Changed Everything — Full Review', channel: 'TechPulse', channelId: 'ch1', views: '3.4M views', ago: '2 days ago', duration: '18:42', tags: ['tech'], thumb: 'https://picsum.photos/seed/tech1/480/270', desc: 'We got our hands on GPT-5 before launch and the results are mind-blowing. Full benchmark, real-world tests, and honest verdict.', youtubeId: null },
  { id: 'v2', title: 'LoFi Hip Hop Radio 🎧 Beats to Chill / Study To', channel: 'LoFi Vibes', channelId: 'ch2', views: '45M views', ago: '1 year ago', duration: 'LIVE', tags: ['music'], thumb: 'https://picsum.photos/seed/lofi2/480/270', desc: 'The original 24/7 LoFi girl stream. Relax, study, and enjoy.', youtubeId: null },
  { id: 'v3', title: 'Elden Ring Shadow of the Erdtree — All Bosses Ranked', channel: 'GameCraft', channelId: 'ch3', views: '1.1M views', ago: '3 weeks ago', duration: '32:15', tags: ['gaming'], thumb: 'https://picsum.photos/seed/game3/480/270', desc: 'Every boss in the DLC ranked from worst to best with no spoiler warnings.', youtubeId: null },
  { id: 'v4', title: 'Breaking: Major Climate Agreement Signed at UN Summit', channel: 'WorldNews24', channelId: 'ch4', views: '890K views', ago: '5 hours ago', duration: '11:07', tags: ['news'], thumb: 'https://picsum.photos/seed/news4/480/270', desc: 'Details on the landmark climate deal and what it means for fossil fuels.', youtubeId: null },
  { id: 'v5', title: 'I Tried Making The Perfect Croissant — 30 Hours Later', channel: 'CookLab', channelId: 'ch5', views: '2.2M views', ago: '1 month ago', duration: '22:48', tags: ['food'], thumb: 'https://picsum.photos/seed/food5/480/270', desc: 'A 30-hour scientific obsession with the perfect croissant. Lamination layers, butter ratios, and more.', youtubeId: null },
  { id: 'v6', title: 'Solo Hiking the Alps — 14 Days, 300km', channel: 'TrailBlazer', channelId: 'ch6', views: '780K views', ago: '2 months ago', duration: '45:00', tags: ['travel', 'sports'], thumb: 'https://picsum.photos/seed/hike6/480/270', desc: 'A full documentary of my solo thru-hike across the Alps. Stunning scenery and brutal climbs.', youtubeId: null },
  { id: 'v7', title: 'Build a Full-Stack App in 1 Hour — React + Node', channel: 'CodeFlow', channelId: 'ch7', views: '556K views', ago: '3 days ago', duration: '58:13', tags: ['tech', 'education'], thumb: 'https://picsum.photos/seed/code7/480/270', desc: 'Full walkthrough: auth, REST API, deployment on Vercel. Perfect for intermediate developers.', youtubeId: null },
  { id: 'v8', title: '30-Minute HIIT Workout — No Equipment Needed', channel: 'FitFusion', channelId: 'ch8', views: '9.1M views', ago: '8 months ago', duration: '30:00', tags: ['sports'], thumb: 'https://picsum.photos/seed/hiit8/480/270', desc: 'A full-body HIIT session you can do anywhere. Warm-up and cool-down included.', youtubeId: null },
  { id: 'v9', title: 'The History of the Internet — Full Documentary', channel: 'TechPulse', channelId: 'ch1', views: '6.7M views', ago: '11 months ago', duration: '1:14:22', tags: ['tech', 'education'], thumb: 'https://picsum.photos/seed/hist9/480/270', desc: 'From ARPANET to TikTok — the complete story of how the internet was built.', youtubeId: null },
  { id: 'v10', title: 'Minecraft 1.21 — Everything New Explained', channel: 'GameCraft', channelId: 'ch3', views: '4.3M views', ago: '1 week ago', duration: '14:55', tags: ['gaming'], thumb: 'https://picsum.photos/seed/mc10/480/270', desc: 'Every feature, mob, and biome added in Minecraft 1.21.', youtubeId: null },
  { id: 'v11', title: 'World Cup 2026 Qualifier Highlights — Top 10 Goals', channel: 'WorldNews24', channelId: 'ch4', views: '5.2M views', ago: '6 days ago', duration: '08:30', tags: ['sports', 'news'], thumb: 'https://picsum.photos/seed/sport11/480/270', desc: 'The most jaw-dropping goals from the latest round of World Cup qualifiers.', youtubeId: null },
  { id: 'v12', title: 'Tokyo Street Food Tour — 12 Must-Try Dishes', channel: 'TrailBlazer', channelId: 'ch6', views: '3.8M views', ago: '4 months ago', duration: '27:30', tags: ['food', 'travel'], thumb: 'https://picsum.photos/seed/tokyo12/480/270', desc: 'We ate our way through Tokyo\'s best street food markets and hidden gems.', youtubeId: null },
];

const SHORTS = [
  { id: 's1', title: 'This AI trick will blow your mind 🤯', channel: 'TechPulse', channelId: 'ch1', views: '14M views', tags: ['tech'], thumb: 'https://picsum.photos/seed/short1/270/480' },
  { id: 's2', title: 'When the croissant layers are PERFECT ✨', channel: 'CookLab', channelId: 'ch5', views: '8.4M views', tags: ['food'], thumb: 'https://picsum.photos/seed/short2/270/480' },
  { id: 's3', title: 'POV: Sunrise at 4000m altitude 🌄', channel: 'TrailBlazer', channelId: 'ch6', views: '22M views', tags: ['travel'], thumb: 'https://picsum.photos/seed/short3/270/480' },
  { id: 's4', title: 'This bug cost me 3 hours 😭 #coding', channel: 'CodeFlow', channelId: 'ch7', views: '5.1M views', tags: ['tech'], thumb: 'https://picsum.photos/seed/short4/270/480' },
  { id: 's5', title: '60-second ab workout 🔥', channel: 'FitFusion', channelId: 'ch8', views: '31M views', tags: ['sports'], thumb: 'https://picsum.photos/seed/short5/270/480' },
  { id: 's6', title: 'Hidden final boss nobody talks about 👀', channel: 'GameCraft', channelId: 'ch3', views: '9.7M views', tags: ['gaming'], thumb: 'https://picsum.photos/seed/short6/270/480' },
  { id: 's7', title: 'News in 60 seconds ⚡', channel: 'WorldNews24', channelId: 'ch4', views: '2.3M views', tags: ['news'], thumb: 'https://picsum.photos/seed/short7/270/480' },
  { id: 's8', title: 'This beat was made in 10 minutes 🎹', channel: 'LoFi Vibes', channelId: 'ch2', views: '18M views', tags: ['music'], thumb: 'https://picsum.photos/seed/short8/270/480' },
];

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
const state = {
  activeTab: 'home',
  activeFilter: 'all',
  searchQuery: '',
  subscribedChannels: new Set(),
  likedVideos: new Set(),
};

// ══════════════════════════════════════════════
//  DOM REFS
// ══════════════════════════════════════════════
const $ = id => document.getElementById(id);
const sections = $('sections');
const modalOverlay = $('modalOverlay');
const sidebar = $('sidebar');

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function filteredVideos() {
  if (state.activeFilter === 'all') return VIDEOS;
  return VIDEOS.filter(v => v.tags.includes(state.activeFilter));
}

function filteredShorts() {
  if (state.activeFilter === 'all') return SHORTS;
  return SHORTS.filter(s => s.tags.includes(state.activeFilter));
}

function getChannel(id) {
  return CHANNELS.find(c => c.id === id) || {};
}

function avatarEl(name, size = 36) {
  const col = avatarColor(name);
  return `<div class="video-card__avatar" style="width:${size}px;height:${size}px;background:${col}">${initials(name)}</div>`;
}

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ══════════════════════════════════════════════
//  RENDER FUNCTIONS
// ══════════════════════════════════════════════

function videoCardHTML(v) {
  const ch = getChannel(v.channelId);
  return `
    <div class="video-card" data-id="${v.id}" role="button" tabindex="0">
      <div class="video-card__thumb">
        <img src="${v.thumb}" alt="${v.title}" loading="lazy"/>
        <div class="play-overlay"><i class="fas fa-play"></i></div>
        <span class="video-card__duration">${v.duration}</span>
      </div>
      <div class="video-card__info">
        ${avatarEl(ch.name || v.channel)}
        <div class="video-card__meta">
          <div class="video-card__title">${v.title}</div>
          <div class="video-card__channel">${v.channel}${ch.verified ? ' <i class="fas fa-check-circle" style="color:#aaa;font-size:.65rem"></i>' : ''}</div>
          <div class="video-card__stats">${v.views} · ${v.ago}</div>
        </div>
      </div>
    </div>`;
}

function shortCardHTML(s) {
  return `
    <div class="short-card" data-id="${s.id}" role="button" tabindex="0">
      <img src="${s.thumb}" alt="${s.title}" loading="lazy"/>
      <div class="short-card__overlay">
        <span class="short-card__badge">SHORT</span>
        <div class="short-card__title">${s.title}</div>
        <div class="short-card__views">${s.views}</div>
      </div>
    </div>`;
}

function channelCardHTML(ch) {
  const subscribed = state.subscribedChannels.has(ch.id);
  const col = avatarColor(ch.name);
  return `
    <div class="channel-card" data-chid="${ch.id}" role="button" tabindex="0">
      <div class="channel-card__avatar" style="background:${col}">${initials(ch.name)}</div>
      <div class="channel-card__name">${ch.name}${ch.verified ? ' <i class="fas fa-check-circle" style="color:#1e88e5;font-size:.75rem"></i>' : ''}</div>
      <div class="channel-card__subs">${ch.subs} subscribers</div>
      <div class="channel-card__desc">${ch.desc}</div>
      <button class="sub-btn ${subscribed ? 'subscribed' : ''}" data-chid="${ch.id}">
        ${subscribed ? 'Subscribed' : 'Subscribe'}
      </button>
    </div>`;
}

function sectionHTML(title, icon, content, id = '') {
  return `
    <div class="section" ${id ? `id="${id}"` : ''}>
      <div class="section__header">
        <div class="section__title"><i class="${icon}"></i> ${title}</div>
        <a href="#" class="section__see-all">See all →</a>
      </div>
      ${content}
    </div>`;
}

// ══════════════════════════════════════════════
//  PAGE RENDERERS
// ══════════════════════════════════════════════

function renderHome() {
  const vids = filteredVideos();
  const shrts = filteredShorts();

  let html = '';

  // Shorts row
  if (shrts.length) {
    const shortsHTML = `<div class="shorts-grid">${shrts.map(shortCardHTML).join('')}</div>`;
    html += sectionHTML('Shorts', 'fas fa-bolt', shortsHTML, 'section-shorts');
  }

  // Videos grid
  if (vids.length) {
    const videosHTML = `<div class="video-grid">${vids.map(videoCardHTML).join('')}</div>`;
    html += sectionHTML('Recommended', 'fas fa-play', videosHTML, 'section-videos');
  } else {
    html += `<div class="empty-state"><i class="fas fa-film"></i><p>No videos found for this filter.</p></div>`;
  }

  sections.innerHTML = html;
  bindCardEvents();
}

function renderShorts() {
  const shortsHTML = `<div class="shorts-grid">${SHORTS.map(shortCardHTML).join('')}</div>`;
  sections.innerHTML = sectionHTML('All Shorts', 'fas fa-bolt', shortsHTML);
  bindCardEvents();
}

function renderChannels() {
  const channelsHTML = `<div class="channels-grid">${CHANNELS.map(channelCardHTML).join('')}</div>`;
  sections.innerHTML = sectionHTML('Browse Channels', 'fas fa-users', channelsHTML);
  bindCardEvents();
  bindSubBtns();
}

function renderSubscriptions() {
  if (state.subscribedChannels.size === 0) {
    sections.innerHTML = `<div class="empty-state"><i class="fas fa-play-circle"></i><p>Subscribe to channels to see their latest videos here.</p></div>`;
    return;
  }
  const subIds = [...state.subscribedChannels];
  const subVids = VIDEOS.filter(v => subIds.includes(v.channelId));
  if (subVids.length === 0) {
    sections.innerHTML = `<div class="empty-state"><i class="fas fa-play-circle"></i><p>Your subscribed channels have no videos yet.</p></div>`;
    return;
  }
  const html = `<div class="video-grid">${subVids.map(videoCardHTML).join('')}</div>`;
  sections.innerHTML = sectionHTML('Subscriptions', 'fas fa-play-circle', html);
  bindCardEvents();
}

function renderCategory(cat) {
  const map = { trending: ['fas fa-fire', 'Trending Now'], music: ['fas fa-music', 'Music'], gaming: ['fas fa-gamepad', 'Gaming'], news: ['fas fa-newspaper', 'News'], sports: ['fas fa-futbol', 'Sports'] };
  const [icon, label] = map[cat] || ['fas fa-play', cat];
  const vids = VIDEOS.filter(v => v.tags.includes(cat));
  const shrts = SHORTS.filter(s => s.tags.includes(cat));
  let html = '';
  if (shrts.length) html += sectionHTML('Shorts', 'fas fa-bolt', `<div class="shorts-grid">${shrts.map(shortCardHTML).join('')}</div>`);
  if (vids.length) html += sectionHTML(label, icon, `<div class="video-grid">${vids.map(videoCardHTML).join('')}</div>`);
  if (!vids.length && !shrts.length) html = `<div class="empty-state"><i class="fas fa-film"></i><p>No content in this category yet.</p></div>`;
  sections.innerHTML = html;
  bindCardEvents();
}

function renderSearch(query) {
  const q = query.toLowerCase().trim();
  const matchVids = VIDEOS.filter(v =>
    v.title.toLowerCase().includes(q) ||
    v.channel.toLowerCase().includes(q) ||
    v.tags.some(t => t.includes(q)) ||
    v.desc.toLowerCase().includes(q)
  );
  const matchChs = CHANNELS.filter(ch =>
    ch.name.toLowerCase().includes(q) ||
    ch.desc.toLowerCase().includes(q)
  );

  let html = `<div class="search-results">
    <div class="search-results__title">Results for <span>"${query}"</span></div>`;

  if (matchChs.length) {
    html += `<div style="margin-bottom:24px">
      <div class="section__title" style="margin-bottom:14px;font-size:1rem"><i class="fas fa-users" style="color:var(--accent)"></i> Channels</div>
      <div class="channels-grid">${matchChs.map(channelCardHTML).join('')}</div>
    </div>`;
  }

  if (matchVids.length) {
    html += `<div class="section__title" style="margin-bottom:14px;font-size:1rem"><i class="fas fa-film" style="color:var(--accent)"></i> Videos</div>
    <div class="result-list">${matchVids.map(v => {
      const ch = getChannel(v.channelId);
      return `<div class="result-item" data-id="${v.id}" role="button" tabindex="0">
        <div class="result-item__thumb">
          <img src="${v.thumb}" alt="${v.title}" loading="lazy"/>
          <span class="video-card__duration">${v.duration}</span>
        </div>
        <div class="result-item__info">
          <div class="result-item__title">${v.title}</div>
          <div class="result-item__channel">${v.channel} ${ch.verified ? '<i class="fas fa-check-circle"></i>' : ''}</div>
          <div class="result-item__stats">${v.views} · ${v.ago}</div>
          <div class="result-item__desc">${v.desc}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  if (!matchVids.length && !matchChs.length) {
    html += `<div class="empty-state"><i class="fas fa-search"></i><p>No results found for "${query}"</p></div>`;
  }

  html += '</div>';
  sections.innerHTML = html;
  bindCardEvents();
  bindSubBtns();
}

function render() {
  const { activeTab, searchQuery } = state;
  if (searchQuery) { renderSearch(searchQuery); return; }
  switch (activeTab) {
    case 'home':          renderHome(); break;
    case 'shorts':        renderShorts(); break;
    case 'channels':      renderChannels(); break;
    case 'subscriptions': renderSubscriptions(); break;
    default:              renderCategory(activeTab); break;
  }
}

// ══════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════

function openModal(videoId) {
  const v = VIDEOS.find(vv => vv.id === videoId);
  const s = SHORTS.find(ss => ss.id === videoId);
  const item = v || s;
  if (!item) return;

  const ch = getChannel(item.channelId);
  const col = avatarColor(item.channel);
  const liked = state.likedVideos.has(videoId);

  $('modalTitle').textContent = item.title;
  $('modalMeta').textContent = item.views + (item.ago ? ' · ' + item.ago : '') + (item.duration ? ' · ' + item.duration : '');
  $('modalChannel').innerHTML = `
    <div class="modal__channel-avatar" style="background:${col}">${initials(item.channel)}</div>
    <span>${item.channel}</span>
    ${ch.verified ? '<i class="fas fa-check-circle" style="color:#1e88e5;font-size:.75rem"></i>' : ''}
    <button class="sub-btn ${state.subscribedChannels.has(item.channelId) ? 'subscribed' : ''}" style="margin-left:auto" data-chid="${item.channelId}">
      ${state.subscribedChannels.has(item.channelId) ? 'Subscribed' : 'Subscribe'}
    </button>`;
  $('modalDesc').textContent = item.desc || 'No description available.';
  $('likeCount').textContent = liked ? 'Liked' : 'Like';

  // Player — show image as placeholder (YouTube embed requires real IDs)
  $('modalPlayer').innerHTML = item.youtubeId
    ? `<iframe src="https://www.youtube.com/embed/${item.youtubeId}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`
    : `<img src="${item.thumb}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover"/>`;

  $('likeBtn').className = 'action-btn' + (liked ? ' liked' : '');
  $('likeBtn').onclick = () => {
    if (state.likedVideos.has(videoId)) {
      state.likedVideos.delete(videoId);
      $('likeBtn').classList.remove('liked');
      $('likeCount').textContent = 'Like';
      showToast('Removed from liked videos');
    } else {
      state.likedVideos.add(videoId);
      $('likeBtn').classList.add('liked');
      $('likeCount').textContent = 'Liked';
      showToast('Added to liked videos ❤️');
    }
  };

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  bindSubBtns();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  $('modalPlayer').innerHTML = '';
}

// ══════════════════════════════════════════════
//  EVENT BINDING
// ══════════════════════════════════════════════

function bindCardEvents() {
  // Video / short cards
  document.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(el.dataset.id); });
  });
}

function bindSubBtns() {
  document.querySelectorAll('.sub-btn[data-chid]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const chid = btn.dataset.chid;
      const ch = getChannel(chid);
      if (state.subscribedChannels.has(chid)) {
        state.subscribedChannels.delete(chid);
        btn.textContent = 'Subscribe';
        btn.classList.remove('subscribed');
        showToast(`Unsubscribed from ${ch.name}`);
      } else {
        state.subscribedChannels.add(chid);
        btn.textContent = 'Subscribed';
        btn.classList.add('subscribed');
        showToast(`Subscribed to ${ch.name} 🔔`);
      }
    });
  });
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════

function init() {

  // Sidebar nav
  document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      state.activeTab = item.dataset.tab;
      state.searchQuery = '';
      $('searchInput').value = '';
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Chip filters
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.activeFilter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      render();
    });
  });

  // Search
  function doSearch() {
    const q = $('searchInput').value.trim();
    if (!q) {
      state.searchQuery = '';
      render();
      return;
    }
    state.searchQuery = q;
    $('chipsBar').style.display = 'none';
    renderSearch(q);
  }

  $('searchBtn').addEventListener('click', doSearch);
  $('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') {
      $('searchInput').value = '';
      state.searchQuery = '';
      $('chipsBar').style.display = '';
      render();
    }
  });
  $('searchInput').addEventListener('input', () => {
    if ($('searchInput').value === '') {
      state.searchQuery = '';
      $('chipsBar').style.display = '';
      render();
    } else {
      $('chipsBar').style.display = 'none';
    }
  });

  // Sidebar toggle
  $('sidebarToggle').addEventListener('click', () => {
    if (window.innerWidth <= 640) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  // Modal close
  $('modalClose').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Initial render
  render();
}

document.addEventListener('DOMContentLoaded', init);