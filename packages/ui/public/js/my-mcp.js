// ============================================================
// my-mcp.js — Composition manager (real API)
// ============================================================

const myMcp = {
  compositions: [],
  selectedServerSlug: null,
  selectedServerName: null,
  activeCompId: null,

  async init() {
    if (!auth.user) {
      const el = $('#compositions-list');
      if (el) el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>請先登入</h3>
          <p class="text-muted mb-16">登入後即可管理您的 MCP 組合</p>
          <button class="btn btn-primary" onclick="auth.login()">登入</button>
        </div>`;
      return;
    }
    await this.loadCompositions();
    // Handle ?add=slug from server detail page
    const addSlug = getQueryParam('add');
    if (addSlug && this.compositions.length > 0) {
      this.activeCompId = this.compositions[0].id;
      this.openAddServerModal();
      setTimeout(() => {
        this.searchServers(addSlug);
        const searchEl = $('#server-search');
        if (searchEl) searchEl.value = addSlug;
      }, 100);
    }
  },

  async loadCompositions() {
    try {
      const res = await api.get('/compositions');
      const comps = res.data || [];
      // Load server details for each composition
      const detailed = [];
      for (const comp of comps) {
        try {
          const detail = await api.get(`/compositions/${comp.id}`);
          detailed.push({
            ...detail.data,
            servers: detail.data.servers || [],
          });
        } catch {
          detailed.push({ ...comp, servers: [] });
        }
      }
      this.compositions = detailed;
    } catch (e) {
      console.error('Failed to load compositions:', e);
      this.compositions = [];
    }
    this.renderCompositionCards();
  },

  renderCompositionCards() {
    const container = $('#compositions-list');
    if (!container) return;

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

    const gatewayBase = window.location.origin;
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
        <p class="text-secondary text-sm">${escapeHtml(comp.description || '')}</p>

        <div class="comp-endpoint">
          <code id="endpoint-${comp.id}">${gatewayBase}/mcp/u/${escapeHtml(comp.endpoint_slug)}</code>
          <button class="btn btn-ghost btn-sm" onclick="copyToClipboard(document.getElementById('endpoint-${comp.id}').textContent)">複製</button>
        </div>

        <!-- Servers in this composition -->
        <div class="comp-servers">
          <div class="flex items-center justify-between mb-8">
            <span class="text-sm font-bold">伺服器 (${(comp.servers || []).length})</span>
            <button class="btn btn-secondary btn-sm" onclick="myMcp.openAddServerModal('${comp.id}')">+ 加入伺服器</button>
          </div>
          ${(comp.servers || []).length > 0 ? (comp.servers || []).map(sv => `
            <div class="comp-server-item">
              <span class="prefix">${escapeHtml(sv.namespace_prefix)}</span>
              <a href="/server.html?slug=${escapeHtml(sv.server_slug || '')}" class="text-sm">${escapeHtml(sv.server_name || sv.server_slug || '')}</a>
              <div style="margin-left:auto;display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm" onclick="myMcp.removeServer('${comp.id}', '${sv.server_id}')" title="移除">✕</button>
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
    return labels[s] || s || '個人';
  },

  // ── Create ──
  openCreateModal() {
    const modal = $('#create-modal');
    if (modal) modal.classList.remove('hidden');
    const nameEl = $('#comp-name');
    if (nameEl) nameEl.focus();
  },

  closeCreateModal() {
    const modal = $('#create-modal');
    if (modal) modal.classList.add('hidden');
    const fields = ['#comp-name', '#comp-desc', '#comp-slug'];
    fields.forEach(f => { const el = $(f); if (el) el.value = ''; });
    const scenario = $('#comp-scenario');
    if (scenario) scenario.value = 'hobby';
  },

  async handleCreateComposition() {
    const name = $('#comp-name').value.trim();
    const desc = $('#comp-desc').value.trim();
    const slug = $('#comp-slug').value.trim();
    const scenario = $('#comp-scenario').value;

    if (!name) { alert('請輸入組合名稱'); return; }
    if (!slug) { alert('請輸入端點代稱'); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { alert('代稱僅允許小寫英文、數字、連字號'); return; }

    try {
      await api.post('/compositions', {
        name,
        description: desc || undefined,
        endpoint_slug: slug,
        scenario: scenario || undefined,
      });
      this.closeCreateModal();
      await this.loadCompositions();
      showToast('組合已建立');
    } catch (e) {
      showToast(e.error || '建立組合失敗');
    }
  },

  // ── Add Server ──
  openAddServerModal(compId) {
    this.activeCompId = compId || (this.compositions[0] && this.compositions[0].id);
    if (!this.activeCompId) { alert('請先建立組合'); return; }
    const modal = $('#add-server-modal');
    if (modal) modal.classList.remove('hidden');
    const searchEl = $('#server-search');
    if (searchEl) searchEl.value = '';
    const prefixEl = $('#add-prefix');
    if (prefixEl) prefixEl.value = '';
    const resultsEl = $('#server-search-results');
    if (resultsEl) resultsEl.innerHTML = '';
    this.selectedServerSlug = null;
    this.selectedServerName = null;
    const confirmBtn = $('#add-server-confirm');
    if (confirmBtn) confirmBtn.disabled = true;
    this.searchServers('');
  },

  closeAddServerModal() {
    const modal = $('#add-server-modal');
    if (modal) modal.classList.add('hidden');
    this.selectedServerSlug = null;
    this.selectedServerName = null;
  },

  async searchServers(query) {
    const q = (query || '').toLowerCase().trim();
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      params.set('limit', '20');
      const res = await api.get(`/servers?${params}`);
      const comp = this.compositions.find(c => c.id === this.activeCompId);
      const existingSlugs = comp ? (comp.servers || []).map(s => s.server_slug) : [];

      const servers = (res.data || [])
        .filter(s => !existingSlugs.includes(s.slug))
        .map(s => ({
          ...s,
          tags: parseJsonField(s.tags),
        }));

      const container = $('#server-search-results');
      if (!container) return;

      if (servers.length === 0) {
        container.innerHTML = '<p class="text-muted text-sm" style="padding:8px;">沒有符合的伺服器</p>';
        return;
      }

      container.innerHTML = servers.map(s => `
        <div class="comp-server-item" style="cursor:pointer;border:1px solid ${this.selectedServerSlug === s.slug ? 'var(--color-primary)' : 'transparent'};border-radius:var(--radius-sm);margin-bottom:4px;"
             onclick="myMcp.selectServer('${escapeHtml(s.slug)}', '${escapeHtml(s.name)}', '${escapeHtml(s.id)}')">
          <div>
            <div class="text-sm font-bold">${escapeHtml(s.name)}</div>
            <div class="text-xs text-muted">${escapeHtml(s.description)}</div>
          </div>
          ${badges.render('data', s.badge_data)}
        </div>
      `).join('');
    } catch (e) {
      console.error('Server search failed:', e);
    }
  },

  selectServer(slug, name, id) {
    this.selectedServerSlug = slug;
    this.selectedServerName = name;
    this.selectedServerId = id;
    const prefix = slug.replace(/^tw-|^taiwan-/, '').replace(/-/g, '_');
    const prefixEl = $('#add-prefix');
    if (prefixEl) prefixEl.value = prefix;
    const confirmBtn = $('#add-server-confirm');
    if (confirmBtn) confirmBtn.disabled = false;
    // Re-render to show selection highlight
    this.searchServers($('#server-search')?.value || '');
  },

  async confirmAddServer() {
    if (!this.selectedServerId) return;
    const prefix = $('#add-prefix').value.trim();
    if (!prefix) { alert('請輸入命名空間前綴'); return; }
    if (!/^[a-z0-9_]+$/.test(prefix)) { alert('前綴僅允許小寫英文、數字、底線'); return; }

    try {
      await api.post(`/compositions/${this.activeCompId}/servers`, {
        server_id: this.selectedServerId,
        namespace_prefix: prefix,
      });
      this.closeAddServerModal();
      await this.loadCompositions();
      showToast('已加入伺服器');
    } catch (e) {
      showToast(e.error || '加入伺服器失敗');
    }
  },

  // ── Remove Server ──
  async removeServer(compId, serverId) {
    if (!confirm('確定要移除此伺服器？')) return;
    try {
      await api.delete(`/compositions/${compId}/servers/${serverId}`);
      await this.loadCompositions();
      showToast('已移除伺服器');
    } catch (e) {
      showToast('移除失敗');
    }
  },

  // ── Toggle Active ──
  async toggleActive(compId, active) {
    try {
      await api.put(`/compositions/${compId}`, { is_active: active });
      const comp = this.compositions.find(c => c.id === compId);
      if (comp) comp.is_active = active;
      this.renderCompositionCards();
      showToast(active ? '組合已啟用' : '組合已停用');
    } catch (e) {
      showToast('切換失敗');
      await this.loadCompositions();
    }
  },

  // ── Delete ──
  async deleteComposition(compId) {
    if (!confirm('確定要刪除此組合？此操作無法復原。')) return;
    try {
      await api.delete(`/compositions/${compId}`);
      await this.loadCompositions();
      showToast('組合已刪除');
    } catch (e) {
      showToast('刪除失敗');
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  myMcp.init();
});
