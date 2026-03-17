// ============================================================
// marketplace.js — Homepage server listing
// ============================================================

const marketplace = {
  allServers: [],
  filtered: [],
  currentCategory: 'all',
  currentSort: 'popular',
  searchQuery: '',
  page: 1,
  perPage: 12,

  init() {
    this.allServers = mockData.servers.filter(s => s.is_published);
    this.applyFilters();
    this.renderStats();
    this.renderCategoryTabs();
    this.setupMobileToggle();
  },

  renderStats() {
    const servers = mockData.servers;
    const totalTools = servers.reduce((sum, s) => sum + s.tools_count, 0);
    const totalCalls = servers.reduce((sum, s) => sum + s.total_calls, 0);
    $('#stat-servers').textContent = servers.filter(s => s.is_published).length;
    $('#stat-tools').textContent = totalTools;
    $('#stat-calls').textContent = formatNumber(totalCalls);
  },

  renderCategoryTabs() {
    const cats = ['all', ...new Set(mockData.servers.map(s => s.category))];
    const html = cats.map(c =>
      `<button class="${c === this.currentCategory ? 'active' : ''}" onclick="marketplace.handleCategoryFilter('${c}')">${categoryLabels[c] || c}</button>`
    ).join('');
    $('#category-tabs').innerHTML = html;
  },

  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.page = 1;
    this.applyFilters();
  },

  handleCategoryFilter(cat) {
    this.currentCategory = cat;
    this.page = 1;
    this.renderCategoryTabs();
    this.applyFilters();
  },

  handleSort(sort) {
    this.currentSort = sort;
    $$('.sort-options button').forEach(b => b.classList.toggle('active', b.dataset.sort === sort));
    this.applyFilters();
  },

  applyFilters() {
    let servers = this.allServers.slice();

    // Category filter
    if (this.currentCategory !== 'all') {
      servers = servers.filter(s => s.category === this.currentCategory);
    }

    // Search filter
    if (this.searchQuery) {
      servers = servers.filter(s =>
        s.name.toLowerCase().includes(this.searchQuery) ||
        s.description.toLowerCase().includes(this.searchQuery) ||
        s.tags.some(t => t.toLowerCase().includes(this.searchQuery)) ||
        s.slug.toLowerCase().includes(this.searchQuery)
      );
    }

    // Data badge filter
    const checkedData = [...$$('#sidebar .filter-section:nth-child(1) input:checked')].map(i => i.value);
    if (checkedData.length > 0 && checkedData.length < 4) {
      servers = servers.filter(s => checkedData.includes(s.badge_data));
    }

    // Source badge filter
    const checkedSource = [...$$('#sidebar .filter-section:nth-child(2) input:checked')].map(i => i.value);
    if (checkedSource.length > 0 && checkedSource.length < 4) {
      servers = servers.filter(s => checkedSource.includes(s.badge_source));
    }

    // Official only
    const officialOnly = $('#sidebar .filter-section:nth-child(3) input').checked;
    if (officialOnly) {
      servers = servers.filter(s => s.is_official);
    }

    // Sort
    switch (this.currentSort) {
      case 'popular':
        servers.sort((a, b) => b.total_calls - a.total_calls);
        break;
      case 'stars':
        servers.sort((a, b) => b.total_stars - a.total_stars);
        break;
      case 'newest':
        servers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'name':
        servers.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
        break;
    }

    this.filtered = servers;
    this.renderServerCards();
    this.renderPagination();
  },

  renderServerCards() {
    const start = (this.page - 1) * this.perPage;
    const pageServers = this.filtered.slice(start, start + this.perPage);

    if (pageServers.length === 0) {
      $('#server-grid').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">🔍</div>
          <h3>找不到符合的伺服器</h3>
          <p class="text-muted">試試其他搜尋條件或篩選</p>
        </div>`;
      $('#result-count').textContent = '0 個結果';
      return;
    }

    $('#result-count').textContent = `${this.filtered.length} 個伺服器`;

    const html = pageServers.map(server => `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <a href="/server.html?slug=${escapeHtml(server.slug)}">${escapeHtml(server.name)}</a>
            ${server.is_official ? '<span class="badge badge-official">官方</span>' : ''}
          </div>
          <span class="text-xs text-muted">v${escapeHtml(server.version)}</span>
        </div>
        <div class="card-desc">${escapeHtml(server.description)}</div>
        ${badges.renderAll(server)}
        <div class="card-tags">
          ${server.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="card-meta mt-8">
          <span title="呼叫次數">📞 ${formatNumber(server.total_calls)}</span>
          <span title="星數">⭐ ${server.total_stars}</span>
          <span title="工具數">🔧 ${server.tools_count}</span>
          <span>${escapeHtml(server.owner.display_name)}</span>
        </div>
      </div>
    `).join('');

    $('#server-grid').innerHTML = html;
  },

  renderPagination() {
    const totalPages = Math.ceil(this.filtered.length / this.perPage);
    if (totalPages <= 1) {
      $('#pagination').innerHTML = '';
      return;
    }
    let html = `<button ${this.page <= 1 ? 'disabled' : ''} onclick="marketplace.goPage(${this.page - 1})">上一頁</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === this.page ? 'active' : ''}" onclick="marketplace.goPage(${i})">${i}</button>`;
    }
    html += `<button ${this.page >= totalPages ? 'disabled' : ''} onclick="marketplace.goPage(${this.page + 1})">下一頁</button>`;
    $('#pagination').innerHTML = html;
  },

  goPage(p) {
    this.page = p;
    this.renderServerCards();
    this.renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  resetFilters() {
    $$('#sidebar input[type="checkbox"]').forEach(cb => {
      // Reset data/source filters to checked, official to unchecked
      cb.checked = cb.value !== 'official';
    });
    this.currentCategory = 'all';
    this.searchQuery = '';
    $('#global-search').value = '';
    this.page = 1;
    this.renderCategoryTabs();
    this.applyFilters();
  },

  toggleSidebar() {
    const sidebar = $('#sidebar');
    sidebar.classList.toggle('open');
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
  marketplace.init();
});
