// ============================================================
// my-servers.js — Developer's own servers management (real API)
// ============================================================

const myServers = {
  servers: [],

  async init() {
    if (!auth.user) {
      const el = $('#my-servers-content');
      if (el) el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>請先登入</h3>
          <p class="text-muted mb-16">登入後即可管理您上架的 MCP 伺服器</p>
          <button class="btn btn-primary" onclick="auth.login()">登入</button>
        </div>`;
      return;
    }
    if (auth.user.role === 'user') {
      const el = $('#my-servers-content');
      if (el) el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👨‍💻</div>
          <h3>需要開發者權限</h3>
          <p class="text-muted mb-16">目前帳號為一般用戶，請聯繫管理員申請開發者角色</p>
          <a href="/" class="btn btn-secondary">回到市集</a>
        </div>`;
      return;
    }
    await this.loadServers();
  },

  async loadServers() {
    try {
      const res = await api.get('/upload');
      this.servers = (res.data || []).map(s => ({
        ...s,
        tags: parseJsonField(s.tags),
      }));
    } catch (e) {
      console.error('Failed to load my servers:', e);
      this.servers = [];
    }
    this.render();
  },

  render() {
    const el = $('#my-servers-content');
    if (!el) return;

    if (this.servers.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>尚未上架任何伺服器</h3>
          <p class="text-muted mb-16">上架您的 MCP 伺服器，讓更多人使用</p>
          <a href="/upload.html" class="btn btn-primary">上架第一個伺服器</a>
        </div>`;
      return;
    }

    el.innerHTML = this.servers.map(s => `
      <div class="card mb-16" style="padding:20px;">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 style="font-size:1.1rem;font-weight:700;margin:0;">${escapeHtml(s.name)}</h3>
            <div class="text-xs text-muted">slug: <code>${escapeHtml(s.slug)}</code> | v${escapeHtml(s.version)}</div>
          </div>
          <span class="badge ${reviewStatusClass(s.review_status)}">${reviewStatusLabels[s.review_status] || s.review_status}</span>
        </div>

        <p class="text-secondary text-sm mb-12">${escapeHtml(s.description)}</p>

        <div class="flex gap-8 mb-12 flex-wrap">
          <div class="badge-group">
            ${badges.render('source', s.badge_source)}
            ${badges.render('data', s.badge_data)}
            ${badges.render('permission', s.badge_permission)}
            ${badges.render('community', s.badge_community)}
          </div>
        </div>

        <div class="stats-grid mb-12" style="grid-template-columns:repeat(4,1fr);">
          <div class="stat-card" style="padding:8px;">
            <div class="stat-value" style="font-size:1rem;">${formatNumber(s.total_calls)}</div>
            <div class="stat-label" style="font-size:0.7rem;">呼叫數</div>
          </div>
          <div class="stat-card" style="padding:8px;">
            <div class="stat-value" style="font-size:1rem;">${formatNumber(s.total_stars)}</div>
            <div class="stat-label" style="font-size:0.7rem;">收藏</div>
          </div>
          <div class="stat-card" style="padding:8px;">
            <div class="stat-value" style="font-size:1rem;">${s.tools_count || 0}</div>
            <div class="stat-label" style="font-size:0.7rem;">工具</div>
          </div>
          <div class="stat-card" style="padding:8px;">
            <div class="stat-value" style="font-size:1rem;">${s.is_published ? '是' : '否'}</div>
            <div class="stat-label" style="font-size:0.7rem;">已發布</div>
          </div>
        </div>

        ${s.review_notes ? `
          <div class="alert ${s.review_status === 'rejected' ? 'alert-warning' : 'alert-info'} mb-12">
            <strong>審核備註：</strong>${escapeHtml(s.review_notes)}
          </div>
        ` : ''}

        <div class="flex gap-8">
          <a href="/server.html?slug=${escapeHtml(s.slug)}" class="btn btn-secondary btn-sm">查看頁面</a>
          <button class="btn btn-secondary btn-sm" onclick="myServers.showVersions('${escapeHtml(s.slug)}', '${escapeHtml(s.name)}')">版本紀錄</button>
          ${s.tags.length > 0 ? `<div class="flex gap-4" style="margin-left:auto;">${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    `).join('');
  },

  async showVersions(slug, name) {
    const titleEl = $('#versions-modal-title');
    if (titleEl) titleEl.textContent = `版本紀錄：${name}`;

    const bodyEl = $('#versions-modal-body');
    if (bodyEl) bodyEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const modal = $('#versions-modal');
    if (modal) modal.classList.remove('hidden');

    try {
      const res = await api.get(`/upload/${slug}/versions`);
      const versions = res.data || [];

      if (versions.length === 0) {
        bodyEl.innerHTML = '<p class="text-muted" style="padding:16px;">尚無版本紀錄</p>';
        return;
      }

      bodyEl.innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>版本</th>
                <th>狀態</th>
                <th>變更說明</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              ${versions.map(v => `
                <tr>
                  <td><code>${escapeHtml(v.version)}</code></td>
                  <td><span class="badge ${reviewStatusClass(v.review_status)}">${reviewStatusLabels[v.review_status] || v.review_status}</span></td>
                  <td class="text-sm">${escapeHtml(v.changelog || '無')}</td>
                  <td class="text-muted">${timeAgo(v.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      bodyEl.innerHTML = '<p class="text-muted" style="padding:16px;">載入版本紀錄失敗</p>';
    }
  },

  closeVersionsModal() {
    const modal = $('#versions-modal');
    if (modal) modal.classList.add('hidden');
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  myServers.init();
});
