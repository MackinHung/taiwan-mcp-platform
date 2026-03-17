// ============================================================
// app.js — Shared utilities for MCP Platform UI
// ============================================================

const API_BASE = '/api';

// ── Auth State ──────────────────────────────────────────────
const auth = {
  user: null,

  async init() {
    try {
      const res = await api.get('/auth/me');
      this.user = res.data;
    } catch {
      this.user = null;
    }
    this.updateUI();
  },

  updateUI() {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (this.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userAvatar) userAvatar.src = this.user.avatar_url || '';
      if (userName) userName.textContent = this.user.display_name || this.user.username;
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  },

  login() {
    this.showLoginModal();
  },

  showLoginModal() {
    // Remove existing modal if present
    const existing = document.getElementById('login-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'login-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;text-align:center;">
        <div class="modal-header" style="justify-content:center;position:relative;">
          <h2>登入 MCP 市集</h2>
          <button class="modal-close" style="position:absolute;right:0;top:0;" onclick="document.getElementById('login-modal').remove()">&times;</button>
        </div>
        <p class="text-secondary text-sm" style="margin-bottom:20px;">選擇登入方式以繼續</p>
        <div class="login-providers">
          <button class="btn btn-login-github w-full" onclick="window.location.href='${API_BASE}/auth/github'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            使用 GitHub 登入
          </button>
          <button class="btn btn-login-google w-full" onclick="window.location.href='${API_BASE}/auth/google'" style="margin-top:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            使用 Google 登入
          </button>
        </div>
      </div>
    `;
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  async logout() {
    await api.post('/auth/logout');
    this.user = null;
    this.updateUI();
    window.location.href = '/';
  },

  requireLogin() {
    if (!this.user) {
      alert('請先登入');
      this.login();
      return false;
    }
    return true;
  },

  requireRole(role) {
    if (!this.requireLogin()) return false;
    if (this.user.role !== role && this.user.role !== 'admin') {
      alert('權限不足');
      return false;
    }
    return true;
  }
};

// ── API Wrapper ─────────────────────────────────────────────
const api = {
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data };
    }
    return data;
  },
  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
};

// ── Badge Rendering ─────────────────────────────────────────
const badges = {
  source: {
    open_audited: { label: '開源已審計', icon: '🛡️', class: 'badge-green' },
    open: { label: '開源', icon: '🔓', class: 'badge-blue' },
    declared: { label: '已聲明', icon: '📄', class: 'badge-amber' },
    undeclared: { label: '未聲明', icon: '❓', class: 'badge-gray' },
  },
  data: {
    public: { label: '公開資料', icon: '🟢', class: 'badge-green' },
    account: { label: '帳號資料', icon: '🟡', class: 'badge-yellow' },
    personal: { label: '個人資料', icon: '🟠', class: 'badge-orange' },
    sensitive: { label: '敏感資料', icon: '🔴', class: 'badge-red' },
  },
  permission: {
    readonly: { label: '唯讀', icon: '👁️', class: 'badge-green' },
    limited_write: { label: '有限寫入', icon: '✏️', class: 'badge-yellow' },
    full_write: { label: '完整寫入', icon: '📝', class: 'badge-orange' },
    system: { label: '系統權限', icon: '⚙️', class: 'badge-red' },
  },
  community: {
    new: { label: '新上架', icon: '🆕', class: 'badge-gray' },
    rising: { label: '成長中', icon: '🌱', class: 'badge-green' },
    popular: { label: '熱門', icon: '📈', class: 'badge-blue' },
    trusted: { label: '信賴', icon: '⭐', class: 'badge-gold' },
  },

  render(type, value) {
    const badge = this[type]?.[value];
    if (!badge) return '';
    return `<span class="badge ${badge.class}" title="${badge.label}">${badge.icon} ${badge.label}</span>`;
  },

  renderAll(server) {
    return `
      <div class="badge-group">
        ${this.render('source', server.badge_source)}
        ${this.render('data', server.badge_data)}
        ${this.render('permission', server.badge_permission)}
        ${this.render('community', server.badge_community)}
      </div>
    `;
  }
};

// ── Theme Toggle ────────────────────────────────────────────
const theme = {
  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon();
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateIcon();
  },
  updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☀️' : '🌙';
  }
};

// ── Mock Data (for development) ─────────────────────────────
const mockData = {
  servers: [
    {
      id: 'srv001', slug: 'taiwan-weather', name: '台灣氣象',
      description: '中央氣象署資料 — 天氣預報、地震、颱風、潮汐',
      version: '1.0.0', category: 'government',
      tags: ['天氣', '氣象', 'forecast', 'earthquake'],
      badge_source: 'open', badge_data: 'public',
      badge_permission: 'readonly', badge_community: 'popular',
      total_calls: 2500, total_stars: 18, is_official: true,
      review_status: 'approved', is_published: true,
      tools_count: 8, owner: { username: 'admin', display_name: 'Platform Admin' },
      created_at: '2026-02-15T10:00:00Z', updated_at: '2026-03-10T08:00:00Z'
    },
    {
      id: 'srv002', slug: 'taiwan-transit', name: '台灣交通',
      description: '公共運輸資料 — 台鐵、高鐵、公車即時到站',
      version: '0.1.0', category: 'government',
      tags: ['交通', '台鐵', '高鐵', '公車'],
      badge_source: 'declared', badge_data: 'public',
      badge_permission: 'readonly', badge_community: 'new',
      total_calls: 0, total_stars: 3, is_official: true,
      review_status: 'pending_scan', is_published: false,
      tools_count: 5, owner: { username: 'admin', display_name: 'Platform Admin' },
      created_at: '2026-03-12T14:00:00Z', updated_at: '2026-03-12T14:00:00Z'
    },
    {
      id: 'srv003', slug: 'taiwan-company', name: '台灣公司查詢',
      description: '經濟部商業司公司登記資料查詢',
      version: '0.1.0', category: 'government',
      tags: ['公司', '商業', '登記'],
      badge_source: 'declared', badge_data: 'public',
      badge_permission: 'readonly', badge_community: 'new',
      total_calls: 50, total_stars: 5, is_official: true,
      review_status: 'scan_passed', is_published: true,
      tools_count: 3, owner: { username: 'admin', display_name: 'Platform Admin' },
      created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-08T12:00:00Z'
    },
    {
      id: 'srv004', slug: 'tw-stock-price', name: '台股即時報價',
      description: '台灣證券交易所即時股價查詢',
      version: '1.2.0', category: 'finance',
      tags: ['股票', '投資', '金融'],
      badge_source: 'open_audited', badge_data: 'account',
      badge_permission: 'readonly', badge_community: 'trusted',
      total_calls: 15000, total_stars: 85, is_official: false,
      review_status: 'approved', is_published: true,
      tools_count: 6, owner: { username: 'fintech_dev', display_name: 'FinTech Dev' },
      created_at: '2026-01-20T08:00:00Z', updated_at: '2026-03-15T16:00:00Z'
    },
    {
      id: 'srv005', slug: 'tw-electricity', name: '台灣電力資訊',
      description: '台電即時用電量、電價查詢',
      version: '1.0.0', category: 'utility',
      tags: ['電力', '能源', '台電'],
      badge_source: 'open', badge_data: 'public',
      badge_permission: 'readonly', badge_community: 'rising',
      total_calls: 350, total_stars: 12, is_official: false,
      review_status: 'scan_passed', is_published: true,
      tools_count: 4, owner: { username: 'energy_lab', display_name: 'Energy Lab' },
      created_at: '2026-02-28T11:00:00Z', updated_at: '2026-03-05T10:00:00Z'
    },
    {
      id: 'srv006', slug: 'tw-social-trends', name: '台灣社群趨勢',
      description: 'PTT、Dcard 熱門話題趨勢分析',
      version: '0.5.0', category: 'social',
      tags: ['社群', 'PTT', 'Dcard', '趨勢'],
      badge_source: 'declared', badge_data: 'public',
      badge_permission: 'readonly', badge_community: 'rising',
      total_calls: 180, total_stars: 8, is_official: false,
      review_status: 'scan_passed', is_published: true,
      tools_count: 3, owner: { username: 'data_miner', display_name: 'Data Miner' },
      created_at: '2026-03-05T15:00:00Z', updated_at: '2026-03-14T09:00:00Z'
    }
  ],

  tools: {
    'taiwan-weather': [
      { name: 'get_forecast_36hr', display_name: '36小時天氣預報', description: '取得台灣各縣市未來 36 小時天氣預報', input_schema: '{ "city": "string (縣市名稱)" }' },
      { name: 'get_forecast_7day', display_name: '7天天氣預報', description: '取得台灣各縣市未來 7 天天氣預報', input_schema: '{ "city": "string (縣市名稱)" }' },
      { name: 'get_earthquake_recent', display_name: '最近地震', description: '取得最近地震報告', input_schema: '{ "limit": "number (筆數, 預設5)" }' },
      { name: 'get_typhoon_active', display_name: '颱風資訊', description: '取得目前活躍颱風資訊', input_schema: '{}' },
      { name: 'get_weather_warning', display_name: '氣象警特報', description: '取得目前生效的氣象警特報', input_schema: '{}' },
      { name: 'get_rain_observation', display_name: '即時雨量', description: '取得即時雨量觀測', input_schema: '{ "city": "string (縣市名稱, 可選)" }' },
      { name: 'get_tidal_forecast', display_name: '潮汐預報', description: '取得潮汐預報', input_schema: '{ "location": "string (觀測站名稱)" }' },
      { name: 'get_uv_index', display_name: '紫外線指數', description: '取得紫外線指數', input_schema: '{ "city": "string (縣市名稱, 可選)" }' },
    ],
    'tw-stock-price': [
      { name: 'get_stock_price', display_name: '即時股價', description: '查詢個股即時報價', input_schema: '{ "symbol": "string (股票代號)" }' },
      { name: 'get_stock_history', display_name: '歷史股價', description: '查詢個股歷史股價', input_schema: '{ "symbol": "string", "days": "number" }' },
      { name: 'get_market_index', display_name: '大盤指數', description: '取得加權指數', input_schema: '{}' },
      { name: 'get_top_movers', display_name: '漲跌排行', description: '取得漲跌幅排行榜', input_schema: '{ "type": "gainers|losers", "limit": "number" }' },
      { name: 'get_stock_info', display_name: '個股資訊', description: '查詢個股基本資料', input_schema: '{ "symbol": "string (股票代號)" }' },
      { name: 'get_dividends', display_name: '股利資訊', description: '查詢個股配息紀錄', input_schema: '{ "symbol": "string", "years": "number" }' },
    ]
  },

  reviews: {
    'taiwan-weather': [
      { step: 'submitted', status: 'done', label: '提交審核', time: '2026-02-15 10:00' },
      { step: 'auto_scan', status: 'done', label: '自動掃描通過', time: '2026-02-15 10:05' },
      { step: 'badge_assigned', status: 'done', label: '徽章評定完成', time: '2026-02-15 10:05' },
      { step: 'approved', status: 'done', label: '審核通過，已上架', time: '2026-02-16 14:30' },
    ],
    'taiwan-transit': [
      { step: 'submitted', status: 'done', label: '提交審核', time: '2026-03-12 14:00' },
      { step: 'auto_scan', status: 'pending', label: '等待自動掃描', time: '' },
    ]
  },

  user: {
    id: 'user001', username: 'demo_user', display_name: 'Demo User',
    avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4',
    role: 'developer', plan: 'free',
    created_at: '2026-02-01T10:00:00Z'
  },

  apiKeys: [
    {
      id: 'key001', prefix: 'sk-abc1', name: '開發測試',
      permissions: ['read', 'compose'], last_used: '2026-03-17T08:00:00Z',
      created_at: '2026-03-01T10:00:00Z', expires_at: null
    },
    {
      id: 'key002', prefix: 'sk-def2', name: 'CI/CD',
      permissions: ['read'], last_used: '2026-03-16T22:00:00Z',
      created_at: '2026-03-10T10:00:00Z', expires_at: '2026-06-10T10:00:00Z'
    }
  ],

  compositions: [
    {
      id: 'comp001', name: '我的 Side Project', description: '天氣 + 交通查詢',
      endpoint_slug: 'my-side-project', scenario: 'hobby', is_active: true,
      servers: [
        { server_slug: 'taiwan-weather', namespace_prefix: 'weather', server_name: '台灣氣象' },
        { server_slug: 'taiwan-transit', namespace_prefix: 'transit', server_name: '台灣交通' },
      ]
    }
  ],

  adminUsers: [
    { id: 'u001', username: 'admin', display_name: 'Admin', role: 'admin', plan: 'unlimited', created_at: '2026-01-01T00:00:00Z' },
    { id: 'u002', username: 'demo_user', display_name: 'Demo User', role: 'developer', plan: 'free', created_at: '2026-02-01T10:00:00Z' },
    { id: 'u003', username: 'fintech_dev', display_name: 'FinTech Dev', role: 'developer', plan: 'pro', created_at: '2026-01-15T08:00:00Z' },
    { id: 'u004', username: 'energy_lab', display_name: 'Energy Lab', role: 'developer', plan: 'free', created_at: '2026-02-20T12:00:00Z' },
    { id: 'u005', username: 'data_miner', display_name: 'Data Miner', role: 'developer', plan: 'free', created_at: '2026-03-01T09:00:00Z' },
  ],

  reports: [
    { id: 'rpt001', server_slug: 'tw-social-trends', server_name: '台灣社群趨勢', type: 'inaccurate', description: '部分 PTT 資料來源已失效', status: 'open', created_at: '2026-03-15T10:00:00Z', reporter: 'demo_user' },
  ]
};

// ── Helpers ──────────────────────────────────────────────────
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(n) {
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 個月前`;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已複製到剪貼簿');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text-primary);font-size:0.875rem;z-index:300;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function renderNav(activePage) {
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo">🇹🇼 MCP 市集</a>
      <div class="nav-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="global-search" placeholder="搜尋 MCP 伺服器..." />
      </div>
      <div class="nav-links">
        <a href="/" class="${activePage === 'home' ? 'active' : ''}">探索</a>
        <a href="/my-mcp.html" class="${activePage === 'my-mcp' ? 'active' : ''} hide-mobile">我的 MCP</a>
        <a href="/upload.html" class="${activePage === 'upload' ? 'active' : ''} hide-mobile">上架</a>
        <button id="theme-toggle" class="btn btn-ghost btn-icon" onclick="theme.toggle()" title="切換主題">☀️</button>
        <button id="login-btn" class="btn btn-primary btn-sm" onclick="auth.login()">登入</button>
        <div id="user-menu" style="display:none;">
          <a href="/profile.html"><img id="user-avatar" src="" alt="avatar" /></a>
          <span id="user-name"></span>
        </div>
      </div>
    </div>
  </nav>`;
}

// Category labels
const categoryLabels = {
  all: '全部',
  government: '政府',
  finance: '金融',
  utility: '公用事業',
  social: '社群',
  education: '教育',
  health: '醫療',
  other: '其他',
};

// Review status labels
const reviewStatusLabels = {
  pending_scan: '等待掃描',
  scanning: '掃描中',
  scan_passed: '掃描通過',
  scan_failed: '掃描失敗',
  pending_review: '等待審核',
  approved: '已核准',
  rejected: '已拒絕',
};

function reviewStatusClass(status) {
  if (status === 'approved' || status === 'scan_passed') return 'badge-green';
  if (status === 'rejected' || status === 'scan_failed') return 'badge-red';
  if (status === 'scanning') return 'badge-blue';
  return 'badge-amber';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  theme.init();
  auth.init();
});
