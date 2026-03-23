// ============================================================
// server-detail.js — Server detail page (real API)
// ============================================================

const freqLabels = { 'real-time': '即時更新', 'hourly': '每小時', 'daily': '每日', 'monthly': '每月', 'static': '靜態資料' };

const serverDetail = {
  server: null,
  slug: null,
  starred: false,

  init() {
    this.slug = getQueryParam('slug');
    if (!this.slug) {
      $('#server-detail').innerHTML = '<div class="empty-state"><h3>未指定伺服器</h3><p><a href="/">回到市集</a></p></div>';
      return;
    }
    this.loadServerDetail(this.slug);
  },

  async loadServerDetail(slug) {
    try {
      const res = await api.get(`/servers/${slug}`);
      const d = res.data;
      this.server = {
        ...d,
        tags: parseJsonField(d.tags),
        tools_count: d.tools ? d.tools.length : 0,
        owner: {
          username: d.owner_username || '',
          display_name: d.owner_display_name || d.owner_username || '未知',
        },
      };
      document.title = `${this.server.name} — Formosa MCP 市集`;
      this.render();
      this.loadVersionHistory();
    } catch (e) {
      console.error('Failed to load server:', e);
      $('#server-detail').innerHTML = '<div class="empty-state"><h3>找不到此伺服器</h3><p><a href="/">回到市集</a></p></div>';
    }
  },

  render() {
    const s = this.server;
    const tools = s.tools || [];
    const gatewayBase = window.location.origin;

    const tg = calculateTrustGrade(s);
    const safetySummary = this.generateSafetySummary(s);

    $('#server-detail').innerHTML = `
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a href="/">探索</a>
        <span class="breadcrumb-sep">${icons.chevronRight}</span>
        ${s.category ? `<a href="/?category=${s.category}">${categoryLabels[s.category] || s.category}</a><span class="breadcrumb-sep">${icons.chevronRight}</span>` : ''}
        <span class="breadcrumb-current">${escapeHtml(s.name)}</span>
      </nav>

      <!-- Safety Summary -->
      <div class="alert alert-info mb-16" style="display:flex;align-items:center;gap:12px;">
        <span class="trust-grade ${tg.class}">${tg.grade}<span class="grade-tip">${tg.tip || 'Trust Grade ' + tg.grade}</span></span>
        <span>${safetySummary}</span>
      </div>

      ${s.disclosed_at && !s.is_published ? this.renderDisclosureBar(s) : ''}

      <!-- Header -->
      <div class="detail-header">
        <div>
          <h1>
            ${escapeHtml(s.name)}
            ${s.is_official ? '<span class="badge badge-official">官方</span>' : ''}
            <span class="version">v${escapeHtml(s.version)}</span>
          </h1>
          <div class="text-sm text-secondary mt-8">
            由 <strong>${escapeHtml(s.owner.display_name)}</strong> 發布 &middot;
            ${s.category ? `<span class="tag">${categoryLabels[s.category] || s.category}</span>` : ''}
            &middot; 更新於 ${timeAgo(s.updated_at)}
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-secondary" onclick="serverDetail.toggleStar()">
            <span class="icon icon-sm">${this.starred ? icons.starFilled : icons.star}</span> ${this.starred ? '已收藏' : '收藏'} <span id="star-count">${s.total_stars}</span>
          </button>
          <button class="btn btn-primary" onclick="serverDetail.addToMcp()">加入我的 MCP</button>
          <button class="btn btn-secondary" onclick="serverDetail.openOpenclawModal()">Add to OpenClaw</button>
          <button class="btn btn-ghost" onclick="serverDetail.openReportModal()">回報</button>
        </div>
      </div>

      <!-- Badges -->
      <div class="detail-section">
        <h2>安全徽章</h2>
        <div class="badge-explain">
          <div class="badge-explain-item explain-source">
            <div class="badge-type">程式碼透明度</div>
            ${badges.render('source', s.badge_source)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('source', s.badge_source)}</div>
          </div>
          <div class="badge-explain-item explain-data">
            <div class="badge-type">資料敏感度</div>
            ${badges.render('data', s.badge_data)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('data', s.badge_data)}</div>
          </div>
          <div class="badge-explain-item explain-permission">
            <div class="badge-type">權限範圍</div>
            ${badges.render('permission', s.badge_permission)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('permission', s.badge_permission)}</div>
          </div>
          <div class="badge-explain-item explain-community">
            <div class="badge-type">社群信任</div>
            ${badges.render('community', s.badge_community)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('community', s.badge_community)}</div>
          </div>
          ${s.badge_external ? `
          <div class="badge-explain-item explain-external">
            <div class="badge-type">第三方驗證</div>
            ${badges.render('external', s.badge_external)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('external', s.badge_external)}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Description -->
      <div class="detail-section">
        <h2>說明</h2>
        <p class="text-secondary">${escapeHtml(s.description)}</p>
        <div class="card-tags mt-8">
          ${s.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <!-- Data Source Info -->
      <div class="detail-section">
        <h2>資料來源</h2>
        <div class="source-info-grid">
          ${s.data_source_agency ? `<div class="source-item"><span class="source-label">資料機關</span><span class="source-value">${escapeHtml(s.data_source_agency)}</span></div>` : ''}
          ${s.data_source_license ? `<div class="source-item"><span class="source-label">資料授權</span><span class="source-value">${escapeHtml(s.data_source_license)}</span></div>` : ''}
          ${s.data_update_frequency ? `<div class="source-item"><span class="source-label">更新頻率</span><span class="source-value">${freqLabels[s.data_update_frequency] || s.data_update_frequency}</span></div>` : ''}
          <div class="source-item"><span class="source-label">API Key</span><span class="source-value">${s.api_key_required ? '需要 API Key' : '不需要（免費使用）'}</span></div>
        </div>
      </div>

      <!-- Tools -->
      <div class="detail-section">
        <h2>工具 (${tools.length})</h2>
        ${tools.length > 0 ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>名稱</th>
                <th>說明</th>
                <th>輸入參數</th>
              </tr>
            </thead>
            <tbody>
              ${tools.map(t => `
                <tr>
                  <td><code>${escapeHtml(t.name)}</code>${t.display_name ? `<br><span class="text-xs text-muted">${escapeHtml(t.display_name)}</span>` : ''}</td>
                  <td class="text-secondary">${escapeHtml(t.description)}</td>
                  <td><code class="text-xs">${escapeHtml(typeof t.input_schema === 'string' ? t.input_schema : JSON.stringify(t.input_schema || {}))}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : '<p class="text-muted">尚無工具資訊</p>'}
      </div>

      <!-- Stats -->
      <div class="detail-section">
        <h2>統計</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatNumber(s.total_calls)}</div>
            <div class="stat-label">累計呼叫</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${s.total_stars}</div>
            <div class="stat-label">收藏數</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${s.tools_count}</div>
            <div class="stat-label">工具數</div>
          </div>
          <div class="stat-card">
            <div class="stat-value"><span class="badge ${reviewStatusClass(s.review_status)}">${reviewStatusLabels[s.review_status] || s.review_status}</span></div>
            <div class="stat-label">審核狀態</div>
          </div>
        </div>
      </div>

      ${s.is_open_source ? `
      <!-- Open Source Info -->
      <div class="detail-section">
        <h2>開源資訊</h2>
        <div class="source-info-grid">
          <div class="source-item"><span class="source-label">授權條款</span><span class="source-value">${escapeHtml(s.license || 'N/A')}</span></div>
          <div class="source-item"><span class="source-label">開源狀態</span><span class="source-value badge badge-success">開源</span></div>
          ${s.github_url ? `<div class="source-item"><span class="source-label">GitHub</span><span class="source-value"><a href="${escapeHtml(s.github_url)}" target="_blank" rel="noopener">${escapeHtml(s.github_url)}</a></span></div>` : ''}
          ${s.repo_url ? `<div class="source-item"><span class="source-label">Repository</span><span class="source-value"><a href="${escapeHtml(s.repo_url)}" target="_blank" rel="noopener">MackinHung/taiwan-mcp-platform</a></span></div>` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Version History -->
      <div class="detail-section">
        <h2>版本歷史</h2>
        <div id="version-history">
          <p class="text-muted text-sm">載入中...</p>
        </div>
      </div>

      <!-- How to Install -->
      <div class="detail-section">
        <h2>如何安裝</h2>
        <div class="install-tabs">
          <button class="install-tab active" onclick="serverDetail.switchInstallTab('claude')">Claude Desktop</button>
          <button class="install-tab" onclick="serverDetail.switchInstallTab('cursor')">Cursor</button>
          <button class="install-tab" onclick="serverDetail.switchInstallTab('vscode')">VS Code</button>
          <button class="install-tab" onclick="serverDetail.switchInstallTab('openclaw')">OpenClaw</button>
          <button class="install-tab" onclick="serverDetail.switchInstallTab('npx')">npx</button>
        </div>
        <div class="code-block" id="install-code">
          <button class="copy-btn" onclick="copyToClipboard(document.getElementById('install-json').textContent)">複製</button>
          <pre id="install-json"></pre>
        </div>
        <p class="text-xs text-muted mt-8">或透過「我的 MCP」頁面將此伺服器加入組合，取得單一端點。</p>
      </div>
    `;
    // Initialize install tab with default
    this.switchInstallTab('claude');
  },

  switchInstallTab(tab) {
    $$('.install-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(tab)));
    const s = this.server;
    if (!s) return;
    const gatewayBase = window.location.origin;
    const slug = escapeHtml(s.slug);
    const npmName = `@formosa-mcp/${slug}`;

    const configs = {
      claude: JSON.stringify({ mcpServers: { [s.slug]: { url: `${gatewayBase}/mcp/s/${slug}`, headers: { Authorization: "Bearer YOUR_API_KEY" } } } }, null, 2),
      cursor: JSON.stringify({ mcpServers: { [s.slug]: { url: `${gatewayBase}/mcp/s/${slug}`, headers: { Authorization: "Bearer YOUR_API_KEY" } } } }, null, 2),
      vscode: JSON.stringify({ "mcp.servers": { [s.slug]: { url: `${gatewayBase}/mcp/s/${slug}`, headers: { Authorization: "Bearer YOUR_API_KEY" } } } }, null, 2),
      openclaw: `# 使用 OpenClaw CLI\nopenclaw add ${slug}\n\n# 或手動加入 openclaw.json\n${JSON.stringify({ skills: [{ name: slug, url: `${gatewayBase}/mcp/s/${slug}` }] }, null, 2)}`,
      npx: `# 使用 npx 直接執行 (需先安裝)\nnpx ${npmName}\n\n# Claude Desktop MCP config (local stdio)\n${JSON.stringify({ mcpServers: { [s.slug]: { command: "npx", args: [npmName] } } }, null, 2)}`,
    };

    const el = document.getElementById('install-json');
    if (el) el.textContent = configs[tab] || configs.claude;
  },

  generateSafetySummary(server) {
    const parts = [];
    if (server.badge_data === 'public') parts.push('僅讀取公開資料');
    else if (server.badge_data === 'account') parts.push('需要帳號資料');
    else if (server.badge_data === 'personal') parts.push('會存取個人資料');
    else parts.push('會存取敏感資料');

    if (server.badge_source === 'open_audited') parts.push('程式碼已開源審計');
    else if (server.badge_source === 'open') parts.push('程式碼已開源');
    else if (server.badge_source === 'declared') parts.push('程式碼行為已聲明');

    if (server.badge_permission === 'readonly') parts.push('僅讀取不修改');

    if (server.badge_external === 'verified') parts.push('通過第三方安全驗證');

    return '此伺服器' + parts.join('，') + '。';
  },

  getBadgeExplain(type, value) {
    const explains = {
      source: {
        open_audited: '程式碼完全開源且經過第三方安全審計',
        open: '程式碼完全開源，可自行檢視',
        declared: '作者已聲明程式碼行為，但非開源',
        undeclared: '程式碼行為未聲明，無法確認安全性',
      },
      data: {
        public: '僅存取公開資料，無隱私疑慮',
        account: '需要帳號資料（如 API Key）才能使用',
        personal: '會存取個人資料（如姓名、Email）',
        sensitive: '會存取敏感資料（如金融、醫療資訊）',
      },
      permission: {
        readonly: '僅讀取資料，不會修改任何內容',
        limited_write: '可進行有限的寫入操作',
        full_write: '可進行完整的寫入操作',
        system: '需要系統層級權限',
      },
      community: {
        new: '新上架的伺服器，尚無足夠使用數據',
        rising: '使用量穩定成長中',
        popular: '高使用量的熱門伺服器',
        trusted: '經過長期驗證的信賴伺服器',
      },
      external: {
        verified: '已通過第三方安全驗證（OSV + OpenSSF Scorecard）',
        partial: '部分通過第三方驗證，無高風險漏洞',
        unverified: '尚未進行第三方驗證',
        failed: '第三方驗證發現高風險漏洞',
      }
    };
    return explains[type]?.[value] || '';
  },

  async loadVersionHistory() {
    const el = $('#version-history');
    if (!el) return;

    try {
      // Version history is only available if user is the owner or admin
      // For public view, show basic version info from the server object
      el.innerHTML = `
        <div class="text-sm">
          <div class="flex items-center gap-8 mb-8">
            <code>v${escapeHtml(this.server.version)}</code>
            <span class="badge ${reviewStatusClass(this.server.review_status)}">${reviewStatusLabels[this.server.review_status] || this.server.review_status}</span>
            ${this.server.badge_external ? badges.render('external', this.server.badge_external) : ''}
          </div>
          <p class="text-xs text-muted">更新於 ${timeAgo(this.server.updated_at)}</p>
        </div>
      `;
    } catch {
      el.innerHTML = '<p class="text-muted text-sm">無法載入版本資訊</p>';
    }
  },

  async toggleStar() {
    if (!auth.requireLogin()) return;
    try {
      if (this.starred) {
        await api.delete(`/servers/${this.slug}/star`);
      } else {
        await api.post(`/servers/${this.slug}/star`);
      }
      this.starred = !this.starred;
      const count = $('#star-count');
      const current = parseInt(count.textContent);
      const newCount = this.starred ? current + 1 : Math.max(0, current - 1);
      count.textContent = newCount;
      const btn = count.parentElement;
      btn.innerHTML = `<span class="icon icon-sm">${this.starred ? icons.starFilled : icons.star}</span> ${this.starred ? '已收藏' : '收藏'} <span id="star-count">${newCount}</span>`;
      showToast(this.starred ? '已收藏' : '已取消收藏');
    } catch (e) {
      showToast('操作失敗，請稍後再試');
    }
  },

  addToMcp() {
    if (!auth.requireLogin()) return;
    window.location.href = `/my-mcp.html?add=${this.slug}`;
  },

  openReportModal() {
    if (!auth.requireLogin()) return;
    const modal = $('#report-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeReportModal() {
    const modal = $('#report-modal');
    if (modal) modal.classList.add('hidden');
    const type = $('#report-type');
    const desc = $('#report-desc');
    if (type) type.value = 'security';
    if (desc) desc.value = '';
  },

  async submitReport() {
    const type = $('#report-type').value;
    const desc = $('#report-desc').value.trim();
    if (!desc || desc.length < 10) {
      alert('請填寫至少 10 字的問題說明');
      return;
    }
    try {
      await api.post(`/servers/${this.slug}/report`, { type, description: desc });
      showToast('回報已送出，感謝您的回饋');
      this.closeReportModal();
    } catch (e) {
      showToast('回報送出失敗，請稍後再試');
    }
  },

  // ── Disclosure Period ──
  renderDisclosureBar(s) {
    const now = Date.now();
    const start = new Date(s.disclosed_at).getTime();
    const end = new Date(s.disclosure_ends_at).getTime();
    const totalMs = end - start;
    const elapsedMs = now - start;
    const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const remaining = Math.max(0, end - now);
    const daysLeft = Math.ceil(remaining / 86400000);
    const hoursLeft = Math.ceil(remaining / 3600000);
    const countdownText = remaining <= 0 ? '即將上架' : remaining > 86400000 ? `${daysLeft} 天後自動上架` : `${hoursLeft} 小時後自動上架`;

    return `
      <div class="alert mb-16" style="background:var(--card-bg);border:2px solid var(--primary);border-radius:12px;padding:1.25rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <strong style="color:var(--primary);">公示期中</strong>
            <span class="text-secondary"> — ${countdownText}</span>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-sm btn-secondary" onclick="serverDetail.castVote('trust')">&#x1F44D; 信任</button>
            <button class="btn btn-sm btn-ghost" onclick="serverDetail.castVote('distrust')">&#x1F44E; 不信任</button>
          </div>
        </div>
        <div style="margin-top:0.75rem;height:6px;border-radius:3px;background:var(--border);">
          <div style="height:100%;border-radius:3px;background:var(--primary);width:${progress}%;"></div>
        </div>
        <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-secondary);">
          社群投票：&#x1F44D; ${s.trust_votes || 0} 信任 &middot; &#x1F44E; ${s.distrust_votes || 0} 不信任
          ${(s.open_reports || 0) > 0 ? ` &middot; <span style="color:var(--danger);">&#x1F6A8; ${s.open_reports} 安全回報</span>` : ''}
        </div>
      </div>
    `;
  },

  async castVote(vote) {
    if (!auth.requireLogin()) return;
    try {
      await api.post(`/disclosure/${this.slug}/vote`, { vote });
      showToast(vote === 'trust' ? '已投信任票' : '已投不信任票');
      this.loadServerDetail(this.slug);
    } catch (e) {
      showToast('投票失敗，請稍後再試');
    }
  },

  // ── OpenClaw Config ──
  async openOpenclawModal() {
    const modal = $('#openclaw-modal');
    if (!modal) return;

    const codeEl = $('#openclaw-json');
    const copyBtn = $('#openclaw-copy-btn');
    if (codeEl) codeEl.textContent = 'Loading...';
    if (copyBtn) copyBtn.disabled = true;

    modal.classList.remove('hidden');

    try {
      const res = await api.get(`/servers/${this.slug}/config?client=openclaw`);
      const json = JSON.stringify(res.data, null, 2);
      if (codeEl) codeEl.textContent = json;
      if (copyBtn) copyBtn.disabled = false;
    } catch (e) {
      if (codeEl) codeEl.textContent = 'Failed to load config';
      showToast('Failed to load OpenClaw config');
    }
  },

  closeOpenclawModal() {
    const modal = $('#openclaw-modal');
    if (modal) modal.classList.add('hidden');
  },

  copyOpenclawConfig() {
    const codeEl = $('#openclaw-json');
    if (!codeEl) return;
    const text = codeEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = $('#openclaw-copy-btn');
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 2000);
    }).catch(() => showToast('Failed to copy to clipboard'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Don't wait for auth — server details are public
  serverDetail.init();
});
