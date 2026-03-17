// ============================================================
// server-detail.js — Server detail page (real API)
// ============================================================

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
      document.title = `${this.server.name} — 台灣 MCP 市集`;
      this.render();
    } catch (e) {
      console.error('Failed to load server:', e);
      $('#server-detail').innerHTML = '<div class="empty-state"><h3>找不到此伺服器</h3><p><a href="/">回到市集</a></p></div>';
    }
  },

  render() {
    const s = this.server;
    const tools = s.tools || [];
    const gatewayBase = window.location.origin;

    $('#server-detail').innerHTML = `
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
            ${this.starred ? '⭐ 已收藏' : '☆ 收藏'} <span id="star-count">${s.total_stars}</span>
          </button>
          <button class="btn btn-primary" onclick="serverDetail.addToMcp()">加入我的 MCP</button>
          <button class="btn btn-ghost" onclick="serverDetail.openReportModal()">回報</button>
        </div>
      </div>

      <!-- Badges -->
      <div class="detail-section">
        <h2>安全徽章</h2>
        <div class="badge-explain">
          <div class="badge-explain-item">
            <div class="badge-type">程式碼透明度</div>
            ${badges.render('source', s.badge_source)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('source', s.badge_source)}</div>
          </div>
          <div class="badge-explain-item">
            <div class="badge-type">資料敏感度</div>
            ${badges.render('data', s.badge_data)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('data', s.badge_data)}</div>
          </div>
          <div class="badge-explain-item">
            <div class="badge-type">權限範圍</div>
            ${badges.render('permission', s.badge_permission)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('permission', s.badge_permission)}</div>
          </div>
          <div class="badge-explain-item">
            <div class="badge-type">社群信任</div>
            ${badges.render('community', s.badge_community)}
            <div class="text-xs text-muted mt-8">${this.getBadgeExplain('community', s.badge_community)}</div>
          </div>
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

      <!-- How to Use -->
      <div class="detail-section">
        <h2>如何使用</h2>
        <p class="text-secondary mb-16">將以下設定加入 Claude Desktop 的 MCP 設定檔：</p>
        <div class="code-block" id="config-code">
          <button class="copy-btn" onclick="copyToClipboard(document.getElementById('config-json').textContent)">複製</button>
<pre id="config-json">{
  "mcpServers": {
    "${escapeHtml(s.slug)}": {
      "url": "${gatewayBase}/mcp/s/${escapeHtml(s.slug)}",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}</pre>
        </div>
        <p class="text-xs text-muted mt-8">或透過「我的 MCP」頁面將此伺服器加入組合，取得單一端點。</p>
      </div>
    `;
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
      }
    };
    return explains[type]?.[value] || '';
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
      btn.innerHTML = `${this.starred ? '⭐ 已收藏' : '☆ 收藏'} <span id="star-count">${newCount}</span>`;
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
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  serverDetail.init();
});
