// ============================================================
// my-servers.js — Developer's own servers management (real API)
// ============================================================

const myServers = {
  servers: [],

  async init() {
    if (!auth.user) {
      const el = $('#my-servers-content');
      if (el) el.innerHTML = `
        <div class="empty-state-promax">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>需要登入</h3>
          <p class="mb-16">登入後即可存取專屬您的 MCP 伺服器管理面板</p>
          <button class="btn btn-primary btn-glow" onclick="auth.login()">安全登入</button>
        </div>`;
      return;
    }
    if (auth.user.role === 'user') {
      const el = $('#my-servers-content');
      if (el) el.innerHTML = `
        <div class="empty-state-promax">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3>需要開發者權限</h3>
          <p class="mb-16">目前為一般用戶，請聯繫服務管理員以開通開發者角色與審核權限。</p>
          <a href="/" class="btn btn-secondary btn-glow">回到市集首頁</a>
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
        <div class="empty-state-promax">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <h3>尚未發布任何伺服器</h3>
          <p class="mb-16">加入在地化生態系，將您的 MCP 伺服器分享給更多 AI 助手存取</p>
          <a href="/upload.html" class="btn btn-primary btn-glow">上架您的第一台伺服器</a>
        </div>`;
      return;
    }

    el.innerHTML = this.servers.map(s => `
      <div class="card mb-16" style="padding:32px 24px;">
        <div class="flex items-center justify-between mb-16">
          <div>
            <h3 style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 8px;">${escapeHtml(s.name)}</h3>
            <div class="text-sm text-secondary">
              <code style="background:var(--bg-elevated);padding:2px 8px;border-radius:4px;">${escapeHtml(s.slug)}</code> 
              <span style="margin:0 8px;color:var(--border);">|</span> 
              v${escapeHtml(s.version)}
            </div>
          </div>
          <span class="badge ${reviewStatusClass(s.review_status)}" style="padding:6px 16px;border-radius:999px;">${reviewStatusLabels[s.review_status] || s.review_status}</span>
        </div>

        <p class="text-secondary text-base mb-16">${escapeHtml(s.description)}</p>

        <div class="flex gap-8 mb-12 flex-wrap">
          <div class="badge-group">
            ${badges.render('source', s.badge_source)}
            ${badges.render('data', s.badge_data)}
            ${badges.render('permission', s.badge_permission)}
            ${badges.render('community', s.badge_community)}
            ${s.badge_external ? badges.render('external', s.badge_external) : ''}
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
            <div class="stat-value" style="font-size:1rem;">${s.is_published ? '✅ 已上架' : s.disclosed_at ? '⏳ 公示中' : '—'}</div>
            <div class="stat-label" style="font-size:0.7rem;">狀態</div>
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

  currentVersionSlug: null,

  async showVersions(slug, name) {
    this.currentVersionSlug = slug;
    const titleEl = $('#versions-modal-title');
    if (titleEl) titleEl.textContent = `版本紀錄：${name}`;

    const bodyEl = $('#versions-modal-body');
    if (bodyEl) bodyEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const modal = $('#versions-modal');
    if (modal) modal.classList.remove('hidden');

    try {
      const res = await api.get(`/upload/${slug}/versions`);
      const versions = res.data || [];

      bodyEl.innerHTML = `
        <!-- Upload form -->
        <details class="mb-16" style="border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;">
          <summary class="text-sm font-bold" style="cursor:pointer;">上傳新版本</summary>
          <div class="mt-12">
            <div class="form-group">
              <label>版本號 (semver)</label>
              <input type="text" id="new-version" placeholder="例如 1.2.0" pattern="^\\d+\\.\\d+\\.\\d+$" />
            </div>
            <div class="form-group">
              <label>變更說明</label>
              <textarea id="new-changelog" rows="2" placeholder="此版本變更內容..."></textarea>
            </div>
            <div class="form-group">
              <label>原始碼檔案</label>
              <input type="file" id="new-source-file" accept=".js,.ts,.mjs" />
              <div class="text-xs text-muted mt-4">上傳 .js/.ts 檔案，系統會自動進行安全掃描</div>
            </div>
            <div class="form-group">
              <label>依賴清單 (JSON，選填)</label>
              <textarea id="new-dependencies" rows="2" placeholder='{"lodash": "4.17.21"}'></textarea>
            </div>
            <button class="btn btn-primary btn-sm" onclick="myServers.uploadVersion()">上傳並掃描</button>
            <div id="upload-result" class="mt-8"></div>
          </div>
        </details>

        ${versions.length === 0 ? '<p class="text-muted" style="padding:16px;">尚無版本紀錄</p>' : `
        <div class="table-wrapper mt-16">
          <table class="table-modern">
            <thead>
              <tr>
                <th>版本號</th>
                <th>審核狀態</th>
                <th>封裝大小</th>
                <th>更新摘要</th>
                <th>發布時間</th>
              </tr>
            </thead>
            <tbody>
              ${versions.map(v => `
                <tr>
                  <td><code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px;">${escapeHtml(v.version)}</code></td>
                  <td><span class="badge ${reviewStatusClass(v.review_status)}">${reviewStatusLabels[v.review_status] || v.review_status}</span></td>
                  <td class="text-secondary font-mono">${v.package_size ? (v.package_size / 1024).toFixed(1) + ' KB' : '-'}</td>
                  <td>${escapeHtml(v.changelog || '無')}</td>
                  <td class="text-secondary">${timeAgo(v.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      `;
    } catch (e) {
      bodyEl.innerHTML = '<p class="text-muted" style="padding:16px;">載入版本紀錄失敗</p>';
    }
  },

  async uploadVersion() {
    const slug = this.currentVersionSlug;
    if (!slug) return;

    const version = ($('#new-version') || {}).value?.trim();
    const changelog = ($('#new-changelog') || {}).value?.trim();
    const fileInput = $('#new-source-file');
    const depsInput = ($('#new-dependencies') || {}).value?.trim();
    const resultEl = $('#upload-result');

    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
      if (resultEl) resultEl.innerHTML = '<div class="alert alert-warning">請輸入有效的 semver 版本號</div>';
      return;
    }

    let sourceCode = undefined;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const text = await file.text();
      sourceCode = btoa(text);
    }

    let dependencies = undefined;
    if (depsInput) {
      try {
        dependencies = JSON.parse(depsInput);
      } catch {
        if (resultEl) resultEl.innerHTML = '<div class="alert alert-warning">依賴清單 JSON 格式錯誤</div>';
        return;
      }
    }

    if (resultEl) resultEl.innerHTML = '<div class="loading"><div class="spinner"></div> 上傳並掃描中...</div>';

    try {
      const body = { version, changelog, source_code: sourceCode, dependencies };
      const res = await api.post(`/upload/${slug}/versions`, body);

      const scan = res.data?.scan;
      if (scan) {
        const passed = scan.status === 'scan_passed';
        const statusLabel = passed ? '掃描通過 — 已進入公示期' : '掃描失敗 ❌';
        resultEl.innerHTML = `
          <div class="alert ${passed ? 'alert-info' : 'alert-warning'}">
            <strong>${statusLabel}</strong><br/>
            ${passed ? '<span class="text-xs text-muted">伺服器將於公示期結束後自動上架（新版本 5 天，小更新 2 天）。</span><br/>' : ''}
            ${scan.badges ? `徽章：${badges.render('external', scan.badges.badge_external || 'unverified')}` : ''}
          </div>
        `;
      } else {
        resultEl.innerHTML = '<div class="alert alert-info">版本已建立（無原始碼掃描）</div>';
      }

      // Refresh version list
      const server = this.servers.find(s => s.slug === slug);
      if (server) this.showVersions(slug, server.name);
      await this.loadServers();
    } catch (e) {
      if (resultEl) resultEl.innerHTML = `<div class="alert alert-warning">${escapeHtml(e.error || '上傳失敗')}</div>`;
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
