// ============================================================
// my-mcp.js — Composition manager
// ============================================================

const myMcp = {
  compositions: [],
  selectedServerSlug: null,
  activeCompId: null,

  init() {
    this.loadCompositions();
    // Handle ?add=slug from server detail page
    const addSlug = getQueryParam('add');
    if (addSlug) {
      // If there are compositions, open add modal for first one
      if (this.compositions.length > 0) {
        this.activeCompId = this.compositions[0].id;
        this.openAddServerModal();
        // Pre-select the server
        setTimeout(() => {
          this.searchServers(addSlug);
          $('#server-search').value = addSlug;
        }, 100);
      }
    }
  },

  loadCompositions() {
    this.compositions = JSON.parse(JSON.stringify(mockData.compositions));
    this.renderCompositionCards();
  },

  renderCompositionCards() {
    const container = $('#compositions-list');
    if (this.compositions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>尚未建立任何組合</h3>
          <p class="text-muted mb-16">建立組合將多個 MCP 伺服器合併為單一端點</p>
          <button class="btn btn-primary" onclick="myMcp.openCreateModal()">建立第一個組合</button>
        </div>`;
      return;
    }

    const gatewayBase = 'https://mcp-gateway.xxx.workers.dev';
    container.innerHTML = this.compositions.map(comp => `
      <div class="comp-card" id="comp-${comp.id}">
        <div class="comp-header">
          <div class="flex items-center gap-8">
            <span class="status-dot ${comp.is_active ? 'active' : 'inactive'}"></span>
            <span class="comp-name">${escapeHtml(comp.name)}</span>
            <span class="tag">${this.scenarioLabel(comp.scenario)}</span>
          </div>
          <div class="flex gap-4">
            <label class="toggle" title="${comp.is_active ? '啟用中' : '已停用'}">
              <input type="checkbox" ${comp.is_active ? 'checked' : ''} onchange="myMcp.toggleActive('${comp.id}', this.checked)" />
              <span class="slider"></span>
            </label>
            <button class="btn btn-ghost btn-sm" onclick="myMcp.deleteComposition('${comp.id}')" title="刪除">🗑️</button>
          </div>
        </div>
        <p class="text-secondary text-sm">${escapeHtml(comp.description)}</p>

        <div class="comp-endpoint">
          <code id="endpoint-${comp.id}">${gatewayBase}/mcp/u/${escapeHtml(comp.endpoint_slug)}</code>
          <button class="btn btn-ghost btn-sm" onclick="copyToClipboard(document.getElementById('endpoint-${comp.id}').textContent)">複製</button>
        </div>

        <!-- Servers in this composition -->
        <div class="comp-servers">
          <div class="flex items-center justify-between mb-8">
            <span class="text-sm font-bold">伺服器 (${comp.servers.length})</span>
            <button class="btn btn-secondary btn-sm" onclick="myMcp.openAddServerModal('${comp.id}')">+ 加入伺服器</button>
          </div>
          ${comp.servers.length > 0 ? comp.servers.map((sv, idx) => `
            <div class="comp-server-item">
              <span class="prefix">${escapeHtml(sv.namespace_prefix)}</span>
              <a href="/server.html?slug=${escapeHtml(sv.server_slug)}" class="text-sm">${escapeHtml(sv.server_name)}</a>
              <div style="margin-left:auto;display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm" onclick="myMcp.editPrefix('${comp.id}', ${idx})" title="編輯前綴">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="myMcp.removeServer('${comp.id}', ${idx})" title="移除">✕</button>
              </div>
            </div>
          `).join('') : '<p class="text-muted text-sm">尚未加入任何伺服器</p>'}
        </div>

        <!-- MCP Config -->
        <details class="mt-16">
          <summary class="text-sm" style="cursor:pointer;color:var(--color-primary);">查看 Claude Desktop 設定</summary>
          <div class="code-block mt-8">
            <button class="copy-btn" onclick="copyToClipboard(document.getElementById('config-${comp.id}').textContent)">複製</button>
<pre id="config-${comp.id}">{
  "mcpServers": {
    "${escapeHtml(comp.endpoint_slug)}": {
      "url": "${gatewayBase}/mcp/u/${escapeHtml(comp.endpoint_slug)}",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}</pre>
          </div>
        </details>

        ${comp.scenario === 'regulated' ? '<div class="alert alert-warning mt-16">受監管產業情境：請確認所有伺服器符合相關法規要求</div>' : ''}
        ${comp.scenario === 'enterprise' ? '<div class="alert alert-info mt-16">企業情境：建議使用開源已審計的伺服器以符合資安政策</div>' : ''}
      </div>
    `).join('');
  },

  scenarioLabel(s) {
    const labels = { hobby: '個人', business: '商業', enterprise: '企業', regulated: '受監管' };
    return labels[s] || s;
  },

  // ── Create ──
  openCreateModal() {
    $('#create-modal').classList.remove('hidden');
    $('#comp-name').focus();
  },

  closeCreateModal() {
    $('#create-modal').classList.add('hidden');
    $('#comp-name').value = '';
    $('#comp-desc').value = '';
    $('#comp-slug').value = '';
    $('#comp-scenario').value = 'hobby';
  },

  handleCreateComposition() {
    const name = $('#comp-name').value.trim();
    const desc = $('#comp-desc').value.trim();
    const slug = $('#comp-slug').value.trim();
    const scenario = $('#comp-scenario').value;

    if (!name) { alert('請輸入組合名稱'); return; }
    if (!slug) { alert('請輸入端點代稱'); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { alert('代稱僅允許小寫英文、數字、連字號'); return; }

    const newComp = {
      id: 'comp' + Date.now(),
      name,
      description: desc,
      endpoint_slug: slug,
      scenario,
      is_active: true,
      servers: []
    };
    this.compositions.push(newComp);
    this.closeCreateModal();
    this.renderCompositionCards();
    showToast('組合已建立');
  },

  // ── Add Server ──
  openAddServerModal(compId) {
    this.activeCompId = compId || (this.compositions[0] && this.compositions[0].id);
    if (!this.activeCompId) { alert('請先建立組合'); return; }
    $('#add-server-modal').classList.remove('hidden');
    $('#server-search').value = '';
    $('#add-prefix').value = '';
    $('#server-search-results').innerHTML = '';
    this.selectedServerSlug = null;
    $('#add-server-confirm').disabled = true;
    this.searchServers('');
  },

  closeAddServerModal() {
    $('#add-server-modal').classList.add('hidden');
    this.selectedServerSlug = null;
  },

  searchServers(query) {
    const q = query.toLowerCase().trim();
    const comp = this.compositions.find(c => c.id === this.activeCompId);
    const existingSlugs = comp ? comp.servers.map(s => s.server_slug) : [];

    let servers = mockData.servers.filter(s => s.is_published && !existingSlugs.includes(s.slug));
    if (q) {
      servers = servers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }

    const container = $('#server-search-results');
    if (servers.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">沒有符合的伺服器</p>';
      return;
    }

    container.innerHTML = servers.map(s => `
      <div class="comp-server-item" style="cursor:pointer;border:1px solid ${this.selectedServerSlug === s.slug ? 'var(--color-primary)' : 'transparent'};border-radius:var(--radius-sm);margin-bottom:4px;"
           onclick="myMcp.selectServer('${s.slug}', '${escapeHtml(s.name)}')">
        <div>
          <div class="text-sm font-bold">${escapeHtml(s.name)}</div>
          <div class="text-xs text-muted">${escapeHtml(s.description)}</div>
        </div>
        ${badges.render('data', s.badge_data)}
      </div>
    `).join('');
  },

  selectServer(slug, name) {
    this.selectedServerSlug = slug;
    // Suggest prefix based on slug
    const prefix = slug.replace(/^tw-|^taiwan-/, '').replace(/-/g, '_');
    $('#add-prefix').value = prefix;
    $('#add-server-confirm').disabled = false;
    this.searchServers($('#server-search').value);
  },

  confirmAddServer() {
    if (!this.selectedServerSlug) return;
    const prefix = $('#add-prefix').value.trim();
    if (!prefix) { alert('請輸入命名空間前綴'); return; }
    if (!/^[a-z0-9_]+$/.test(prefix)) { alert('前綴僅允許小寫英文、數字、底線'); return; }

    const comp = this.compositions.find(c => c.id === this.activeCompId);
    if (!comp) return;

    const server = mockData.servers.find(s => s.slug === this.selectedServerSlug);
    comp.servers.push({
      server_slug: this.selectedServerSlug,
      namespace_prefix: prefix,
      server_name: server ? server.name : this.selectedServerSlug
    });

    this.closeAddServerModal();
    this.renderCompositionCards();
    showToast('已加入伺服器');
  },

  // ── Remove Server ──
  removeServer(compId, idx) {
    if (!confirm('確定要移除此伺服器？')) return;
    const comp = this.compositions.find(c => c.id === compId);
    if (!comp) return;
    comp.servers.splice(idx, 1);
    this.renderCompositionCards();
    showToast('已移除伺服器');
  },

  // ── Edit Prefix ──
  editPrefix(compId, idx) {
    const comp = this.compositions.find(c => c.id === compId);
    if (!comp) return;
    const sv = comp.servers[idx];
    const newPrefix = prompt('新的命名空間前綴：', sv.namespace_prefix);
    if (newPrefix === null) return;
    const trimmed = newPrefix.trim();
    if (!trimmed || !/^[a-z0-9_]+$/.test(trimmed)) {
      alert('前綴僅允許小寫英文、數字、底線');
      return;
    }
    sv.namespace_prefix = trimmed;
    this.renderCompositionCards();
    showToast('前綴已更新');
  },

  // ── Toggle Active ──
  toggleActive(compId, active) {
    const comp = this.compositions.find(c => c.id === compId);
    if (!comp) return;
    comp.is_active = active;
    this.renderCompositionCards();
    showToast(active ? '組合已啟用' : '組合已停用');
  },

  // ── Delete ──
  deleteComposition(compId) {
    if (!confirm('確定要刪除此組合？此操作無法復原。')) return;
    this.compositions = this.compositions.filter(c => c.id !== compId);
    this.renderCompositionCards();
    showToast('組合已刪除');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  myMcp.init();
});
