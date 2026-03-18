// ============================================================
// marketplace.js — Homepage server listing (real API)
// ============================================================

const marketplace = {
  filtered: [],
  currentCategory: 'all',
  currentSort: 'popular',
  searchQuery: '',
  page: 1,
  perPage: 12,
  totalCount: 0,
  totalPages: 0,

  async init() {
    this.renderCategoryTabs();
    this.setupMobileToggle();
    this.renderSkeletonCards();
    this.renderBadgeEducationExamples();
    // Load servers and stats in parallel
    this.loadServers();
    this.renderStats();
  },

  renderBadgeEducationExamples() {
    const dimensions = {
      source: ['open_audited', 'open', 'declared', 'undeclared'],
      data: ['public', 'account', 'personal', 'sensitive'],
      permission: ['readonly', 'limited_write', 'full_write', 'system'],
      community: ['new', 'rising', 'popular', 'trusted'],
    };
    for (const [type, values] of Object.entries(dimensions)) {
      const el = $(`#edu-badges-${type}`);
      if (el) {
        el.innerHTML = values.map(v => badges.render(type, v)).join('');
      }
    }
  },

  renderSkeletonCards() {
    const el = $('#server-grid');
    if (!el) return;
    const skeleton = Array(6).fill('').map(() => `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-desc"></div>
        <div class="skeleton-line skeleton-desc-short"></div>
        <div style="margin-top:12px;">
          <span class="skeleton-line skeleton-badge"></span>
          <span class="skeleton-line skeleton-badge"></span>
          <span class="skeleton-line skeleton-badge"></span>
        </div>
        <div class="skeleton-line skeleton-meta"></div>
      </div>
    `).join('');
    el.innerHTML = skeleton;
  },

  async loadServers() {
    try {
      const params = new URLSearchParams();
      if (this.currentCategory !== 'all') params.set('category', this.currentCategory);
      if (this.searchQuery) params.set('search', this.searchQuery);
      params.set('sort', this.currentSort);
      params.set('page', this.page);
      params.set('limit', this.perPage);

      const res = await api.get(`/servers?${params}`);
      this.filtered = (res.data || []).map(s => ({
        ...s,
        tags: parseJsonField(s.tags),
        owner: {
          username: s.owner_username || '',
          display_name: s.owner_display_name || s.owner_username || '未知',
        },
      }));
      this.totalCount = res.meta?.total ?? 0;
      this.totalPages = res.meta?.total_pages ?? 0;
    } catch (e) {
      console.error('Failed to load servers:', e);
      this.filtered = [];
      this.totalCount = 0;
      this.totalPages = 0;
    }

    this.renderServerCards();
    this.renderPagination();
  },

  async renderStats() {
    try {
      const res = await api.get('/servers/stats');
      const stats = res.data;
      const elServers = $('#stat-servers');
      const elTools = $('#stat-tools');
      const elCalls = $('#stat-calls');
      if (elServers) animateCounter(elServers, stats.total_published);
      if (elTools) animateCounter(elTools, stats.total_tools);
      if (elCalls) animateCounter(elCalls, stats.total_calls, 1500);
    } catch {
      // Stats are non-critical; keep default values
    }
  },

  renderCategoryTabs() {
    const cats = ['all', 'government', 'finance', 'utility', 'social', 'other'];
    const html = cats.map(c =>
      `<button class="${c === this.currentCategory ? 'active' : ''}" onclick="marketplace.handleCategoryFilter('${c}')">${categoryLabels[c] || c}</button>`
    ).join('');
    const el = $('#category-tabs');
    if (el) el.innerHTML = html;
  },

  _debouncedSearch: null,

  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.page = 1;
    if (!this._debouncedSearch) {
      this._debouncedSearch = debounce(() => this.loadServers(), 300);
    }
    this._debouncedSearch();
  },

  handleCategoryFilter(cat) {
    this.currentCategory = cat;
    this.page = 1;
    this.renderCategoryTabs();
    this.loadServers();
  },

  handleSort(sort) {
    this.currentSort = sort;
    $$('.sort-options button').forEach(b => b.classList.toggle('active', b.dataset.sort === sort));
    this.page = 1;
    this.loadServers();
  },

  applyFilters() {
    // Badge sidebar filters are applied client-side on current results
    // Since the API supports badge_data and badge_source, we could add those
    // For now, trigger a full reload
    this.page = 1;
    this.loadServers();
  },

  renderServerCards() {
    const pageServers = this.filtered;

    if (pageServers.length === 0) {
      const el = $('#server-grid');
      if (el) el.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon"><span class="icon icon-xl" style="color:var(--text-muted)">${icons.search}</span></div>
          <h3>找不到符合的伺服器</h3>
          <p class="text-muted">試試其他搜尋條件或篩選</p>
        </div>`;
      const countEl = $('#result-count');
      if (countEl) countEl.textContent = '0 個結果';
      return;
    }

    const countEl = $('#result-count');
    if (countEl) countEl.textContent = `${this.totalCount} 個伺服器`;

    const html = pageServers.map(server => {
      const tg = calculateTrustGrade(server);
      return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <a href="/server.html?slug=${escapeHtml(server.slug)}">${escapeHtml(server.name)}</a>
            ${server.is_official ? '<span class="badge badge-official">官方</span>' : ''}
          </div>
          <span class="trust-grade ${tg.class}">${tg.grade}<span class="grade-tip">${tg.tip}</span></span>
        </div>
        <div class="card-desc">${escapeHtml(server.description)}</div>
        ${badges.renderCardSummary(server)}
        <div class="card-tags">
          ${(server.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="card-meta mt-8">
          <span title="呼叫次數"><span class="icon icon-sm">${icons.phone}</span> ${formatNumber(server.total_calls)}</span>
          <span title="星數"><span class="icon icon-sm">${icons.star}</span> ${server.total_stars}</span>
          <span title="工具數"><span class="icon icon-sm">${icons.wrench}</span> ${server.tools_count || 0}</span>
          <span>${escapeHtml(server.owner.display_name)}</span>
        </div>
      </div>
    `;}).join('');

    const el = $('#server-grid');
    if (el) el.innerHTML = html;
  },

  renderPagination() {
    const pag = $('#pagination');
    if (!pag) return;

    if (this.totalPages <= 1) {
      pag.innerHTML = '';
      return;
    }
    let html = `<button ${this.page <= 1 ? 'disabled' : ''} onclick="marketplace.goPage(${this.page - 1})">上一頁</button>`;
    for (let i = 1; i <= this.totalPages; i++) {
      html += `<button class="${i === this.page ? 'active' : ''}" onclick="marketplace.goPage(${i})">${i}</button>`;
    }
    html += `<button ${this.page >= this.totalPages ? 'disabled' : ''} onclick="marketplace.goPage(${this.page + 1})">下一頁</button>`;
    pag.innerHTML = html;
  },

  goPage(p) {
    this.page = p;
    this.loadServers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  resetFilters() {
    $$('#sidebar input[type="checkbox"]').forEach(cb => {
      cb.checked = cb.value !== 'official';
    });
    this.currentCategory = 'all';
    this.searchQuery = '';
    const searchEl = $('#global-search');
    if (searchEl) searchEl.value = '';
    this.page = 1;
    this.renderCategoryTabs();
    this.loadServers();
  },

  toggleSidebar() {
    const sidebar = $('#sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  },

  setupMobileToggle() {
    const checkMobile = () => {
      const toggle = $('#filter-toggle');
      if (toggle) toggle.style.display = window.innerWidth <= 768 ? 'block' : 'none';
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Don't wait for auth — marketplace shows public data
  marketplace.init();
});
