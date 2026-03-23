// ============================================================
// admin.js — Admin dashboard (real API)
// ============================================================

const admin = {
  reviewingServer: null,
  editingUser: null,
  reviewQueue: [],
  users: [],
  reports: [],
  anomalyLogs: [],

  async init() {
    if (!auth.user || auth.user.role !== 'admin') {
      const el = $('#admin-content');
      if (el) el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>需要管理員權限</h3>
          <p class="text-muted mb-16">此頁面僅限管理員存取</p>
          <a href="/" class="btn btn-secondary">回到市集</a>
        </div>`;
      return;
    }
    await Promise.all([
      this.renderStats(),
      this.loadReviewQueue(),
      this.loadUsers(),
      this.loadReports(),
      this.loadAnomalyLogs(),
    ]);
  },

  switchTab(tab) {
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  },

  // ── Stats ──
  async renderStats() {
    try {
      const res = await api.get('/admin/stats');
      const stats = res.data;
      const el = $('#admin-stats');
      if (!el) return;
      el.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.users}</div>
          <div class="stat-label">使用者</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.servers}</div>
          <div class="stat-label">伺服器</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatNumber(stats.total_calls)}</div>
          <div class="stat-label">累計呼叫</div>
        </div>
        <div class="stat-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <button class="btn btn-secondary btn-sm" onclick="admin.recalculateBadges()" id="recalc-badges-btn">重算社群徽章</button>
        </div>
      `;
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    }
  },

  // ── Review Queue ──
  async loadReviewQueue() {
    try {
      const res = await api.get('/admin/review-queue');
      this.reviewQueue = (res.data || []).map(s => ({
        ...s,
        tags: parseJsonField(s.tags),
      }));
    } catch (e) {
      console.error('Failed to load review queue:', e);
      this.reviewQueue = [];
    }
    this.renderReviewQueue();
  },

  renderReviewQueue() {
    const el = $('#review-queue');
    if (!el) return;

    if (this.reviewQueue.length === 0) {
      el.innerHTML = '<div class="empty-state"><h3>沒有待審核的伺服器</h3></div>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>伺服器</th>
              <th>版本</th>
              <th>分類</th>
              <th>徽章</th>
              <th>狀態</th>
              <th>提交日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.reviewQueue.map(s => `
              <tr>
                <td>
                  <div class="font-bold">${escapeHtml(s.name)}</div>
                  <div class="text-xs text-muted">${escapeHtml(s.slug)}</div>
                </td>
                <td>${escapeHtml(s.version)}</td>
                <td>${categoryLabels[s.category] || s.category}</td>
                <td>
                  <div class="badge-group">
                    ${badges.render('source', s.badge_source)}
                    ${badges.render('data', s.badge_data)}
                  </div>
                </td>
                <td>
                  <span class="badge ${reviewStatusClass(s.review_status)}">${reviewStatusLabels[s.review_status] || s.review_status}</span>
                  ${s.disclosed_at && !s.is_published ? `<div class="text-xs text-muted" style="margin-top:2px;">👍 ${s.trust_votes || 0} 👎 ${s.distrust_votes || 0}${(s.open_reports || 0) > 0 ? ` <span style="color:var(--danger);">🚨 ${s.open_reports}</span>` : ''}</div>` : ''}
                </td>
                <td class="text-muted">${timeAgo(s.created_at)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="admin.openReviewModal('${s.id}')">檢視</button>
                  ${s.disclosed_at && !s.is_published ? `
                    <button class="btn btn-sm" style="background:var(--primary);color:#fff;margin-left:4px;" onclick="admin.expediteServer('${s.id}')">快速上架</button>
                    <button class="btn btn-ghost btn-sm" style="margin-left:2px;" onclick="admin.extendDisclosure('${s.id}')">延長</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openReviewModal(serverId) {
    const server = this.reviewQueue.find(s => s.id === serverId);
    if (!server) return;
    this.reviewingServer = server;

    const titleEl = $('#review-modal-title');
    if (titleEl) titleEl.textContent = `審核：${server.name}`;

    const isActionable = !['approved', 'rejected'].includes(server.review_status);

    const bodyEl = $('#review-modal-body');
    if (bodyEl) bodyEl.innerHTML = `
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">基本資訊</div>
        <table style="width:100%;font-size:0.875rem;">
          <tr><td class="text-muted" style="width:100px;">名稱</td><td>${escapeHtml(server.name)}</td></tr>
          <tr><td class="text-muted">代稱</td><td><code>${escapeHtml(server.slug)}</code></td></tr>
          <tr><td class="text-muted">版本</td><td>${escapeHtml(server.version)}</td></tr>
          <tr><td class="text-muted">分類</td><td>${categoryLabels[server.category] || server.category}</td></tr>
          <tr><td class="text-muted">說明</td><td>${escapeHtml(server.description)}</td></tr>
        </table>
      </div>
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">安全聲明</div>
        <div class="badge-group">
          ${badges.render('source', server.badge_source)}
          ${badges.render('data', server.badge_data)}
          ${badges.render('permission', server.badge_permission)}
          ${badges.render('community', server.badge_community)}
          ${server.badge_external ? badges.render('external', server.badge_external) : ''}
        </div>
      </div>
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">掃描報告</div>
        <div id="scan-report-section">
          <p class="text-muted text-xs">載入中...</p>
        </div>
      </div>
      ${isActionable ? `
        <div class="form-group">
          <label>審核備註（選填）</label>
          <textarea id="review-notes" rows="3" placeholder="審核備註..."></textarea>
        </div>
      ` : ''}
    `;

    // Load scan report asynchronously
    this.loadScanReport(server.id, server.version);

    const approveBtn = $('#review-approve-btn');
    const rejectBtn = $('#review-reject-btn');
    if (approveBtn) approveBtn.style.display = isActionable ? 'block' : 'none';
    if (rejectBtn) rejectBtn.style.display = isActionable ? 'block' : 'none';

    const modal = $('#review-detail-modal');
    if (modal) modal.classList.remove('hidden');
  },

  async loadScanReport(serverId, version) {
    const el = $('#scan-report-section');
    if (!el) return;

    try {
      const res = await api.get(`/admin/scan-reports/${serverId}/${version}`);
      const report = res.data;

      if (!report) {
        el.innerHTML = '<p class="text-muted text-xs">尚無掃描報告</p>';
        return;
      }

      const details = typeof report.details === 'string' ? JSON.parse(report.details) : (report.details || {});
      const rules = details.rules || [];
      const externalScan = report.external_scan_results
        ? (typeof report.external_scan_results === 'string' ? JSON.parse(report.external_scan_results) : report.external_scan_results)
        : null;

      el.innerHTML = `
        <div class="text-xs">
          <div class="mb-8"><strong>掃描狀態：</strong>
            <span class="badge ${report.status === 'pass' ? 'badge-green' : report.status === 'warn' ? 'badge-amber' : 'badge-red'}">${report.status === 'pass' ? '通過' : report.status === 'warn' ? '警告' : '失敗'}</span>
            ${report.scan_duration_ms ? `<span class="text-muted ml-8">(${report.scan_duration_ms}ms)</span>` : ''}
          </div>
          ${rules.length > 0 ? `
          <div class="mb-8"><strong>規則結果：</strong></div>
          <table style="width:100%;font-size:0.75rem;">
            <thead><tr><th>規則</th><th>結果</th><th>詳情</th></tr></thead>
            <tbody>
              ${rules.map(r => `
                <tr>
                  <td>${escapeHtml(r.ruleName)}</td>
                  <td><span class="badge ${r.pass ? 'badge-green' : r.severity === 'warn' ? 'badge-amber' : 'badge-red'}">${r.pass ? '通過' : r.severity}</span></td>
                  <td>${escapeHtml(r.details)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : ''}
          ${externalScan ? `
          <div class="mt-12 mb-8"><strong>第三方驗證：</strong>
            <span class="badge ${externalScan.overallStatus === 'pass' ? 'badge-green' : externalScan.overallStatus === 'warn' ? 'badge-amber' : 'badge-red'}">${externalScan.overallStatus}</span>
          </div>
          <div class="mb-4">OSV 漏洞：${externalScan.osv?.vulnerabilities?.length || 0} 個</div>
          ${(externalScan.osv?.vulnerabilities || []).length > 0 ? `
          <table style="width:100%;font-size:0.75rem;">
            <thead><tr><th>CVE</th><th>嚴重度</th><th>套件</th><th>摘要</th></tr></thead>
            <tbody>
              ${externalScan.osv.vulnerabilities.map(v => `
                <tr>
                  <td><code>${escapeHtml(v.id)}</code></td>
                  <td><span class="badge ${v.severity === 'CRITICAL' || v.severity === 'HIGH' ? 'badge-red' : 'badge-amber'}">${escapeHtml(v.severity)}</span></td>
                  <td>${escapeHtml(v.package)}</td>
                  <td>${escapeHtml(v.summary)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : ''}
          <div class="mt-4">deps.dev Scorecard：${externalScan.depsDev?.scorecardScore !== null ? externalScan.depsDev.scorecardScore + '/10' : 'N/A'}</div>
          <div>授權：${(externalScan.depsDev?.licenses || []).join(', ') || 'N/A'}</div>
          ` : '<div class="mt-8 text-muted">無第三方驗證資料</div>'}
        </div>
      `;
    } catch {
      el.innerHTML = '<p class="text-muted text-xs">載入掃描報告失敗</p>';
    }
  },

  closeReviewModal() {
    const modal = $('#review-detail-modal');
    if (modal) modal.classList.add('hidden');
    this.reviewingServer = null;
  },

  async handleReview(decision) {
    if (!this.reviewingServer) return;
    const action = decision === 'approved' ? '核准' : '拒絕';
    if (!confirm(`確定要${action}此伺服器？`)) return;

    const notes = $('#review-notes')?.value?.trim() || undefined;

    try {
      await api.post(`/admin/review/${this.reviewingServer.id}`, {
        status: decision,
        notes,
      });
      this.closeReviewModal();
      await Promise.all([this.loadReviewQueue(), this.renderStats()]);
      showToast(`已${action}：${this.reviewingServer.name}`);
    } catch (e) {
      showToast('審核操作失敗');
    }
  },

  // ── Users ──
  async loadUsers() {
    try {
      const res = await api.get('/admin/users');
      this.users = res.data || [];
    } catch (e) {
      console.error('Failed to load users:', e);
      this.users = [];
    }
    this.renderUsers();
  },

  renderUsers() {
    const el = $('#user-list');
    if (!el) return;

    if (this.users.length === 0) {
      el.innerHTML = '<div class="empty-state"><h3>尚無使用者</h3></div>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>使用者</th>
              <th>角色</th>
              <th>方案</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(u => `
              <tr>
                <td>
                  <div class="font-bold">${escapeHtml(u.display_name)}</div>
                  <div class="text-xs text-muted">@${escapeHtml(u.username)}</div>
                </td>
                <td><span class="badge badge-blue">${this.roleLabel(u.role)}</span></td>
                <td><span class="badge badge-amber">${this.planLabel(u.plan)}</span></td>
                <td class="text-muted">${timeAgo(u.created_at)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="admin.openEditUserModal('${u.id}')">編輯</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  roleLabel(role) {
    const labels = { admin: '管理員', developer: '開發者', user: '一般用戶', viewer: '檢視者' };
    return labels[role] || role;
  },

  planLabel(plan) {
    const labels = { free: '免費', developer: '開發者', team: '團隊', enterprise: '企業' };
    return labels[plan] || plan;
  },

  openEditUserModal(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    this.editingUser = user;

    const bodyEl = $('#edit-user-body');
    if (bodyEl) bodyEl.innerHTML = `
      <div class="form-group">
        <label>使用者</label>
        <input type="text" value="${escapeHtml(user.display_name)} (@${escapeHtml(user.username)})" disabled />
      </div>
      <div class="form-group">
        <label>角色</label>
        <select id="edit-role">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>一般用戶</option>
          <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>開發者</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理員</option>
        </select>
      </div>
      <div class="form-group">
        <label>方案</label>
        <select id="edit-plan">
          <option value="free" ${user.plan === 'free' ? 'selected' : ''}>免費</option>
          <option value="developer" ${user.plan === 'developer' ? 'selected' : ''}>開發者</option>
          <option value="team" ${user.plan === 'team' ? 'selected' : ''}>團隊</option>
          <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>企業</option>
        </select>
      </div>
    `;

    const modal = $('#edit-user-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeEditUserModal() {
    const modal = $('#edit-user-modal');
    if (modal) modal.classList.add('hidden');
    this.editingUser = null;
  },

  async saveUser() {
    if (!this.editingUser) return;
    const role = $('#edit-role').value;
    const plan = $('#edit-plan').value;

    try {
      await api.put(`/admin/users/${this.editingUser.id}`, { role, plan });
      this.closeEditUserModal();
      await this.loadUsers();
      showToast('使用者已更新');
    } catch (e) {
      showToast('更新失敗');
    }
  },

  // ── Reports ──
  async loadReports() {
    try {
      const res = await api.get('/admin/reports');
      this.reports = res.data || [];
    } catch (e) {
      console.error('Failed to load reports:', e);
      this.reports = [];
    }
    this.renderReports();
  },

  renderReports() {
    const el = $('#report-list');
    if (!el) return;

    if (this.reports.length === 0) {
      el.innerHTML = '<div class="empty-state"><h3>尚無回報</h3><p class="text-muted">目前沒有使用者回報的問題</p></div>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>類型</th>
              <th>伺服器</th>
              <th>回報者</th>
              <th>說明</th>
              <th>狀態</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.reports.map(r => `
              <tr>
                <td><span class="badge ${this.reportTypeClass(r.type)}">${this.reportTypeLabel(r.type)}</span></td>
                <td>
                  <a href="/server.html?slug=${escapeHtml(r.server_slug || '')}" class="text-sm font-bold">${escapeHtml(r.server_name || '未知')}</a>
                </td>
                <td class="text-sm">${escapeHtml(r.reporter_display_name || r.reporter_username || '未知')}</td>
                <td class="text-sm" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.description)}">${escapeHtml(r.description)}</td>
                <td><span class="badge ${this.reportStatusClass(r.status)}">${this.reportStatusLabel(r.status)}</span></td>
                <td class="text-muted">${timeAgo(r.created_at)}</td>
                <td>
                  <select class="btn btn-secondary btn-sm" onchange="admin.updateReportStatus('${r.id}', this.value)" style="padding:4px 8px;font-size:0.75rem;">
                    <option value="" disabled selected>操作</option>
                    <option value="investigating" ${r.status === 'investigating' ? 'disabled' : ''}>調查中</option>
                    <option value="resolved" ${r.status === 'resolved' ? 'disabled' : ''}>已解決</option>
                    <option value="dismissed" ${r.status === 'dismissed' ? 'disabled' : ''}>忽略</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  reportTypeLabel(type) {
    const labels = { security: '安全問題', bug: '錯誤', abuse: '濫用', other: '其他' };
    return labels[type] || type;
  },

  reportTypeClass(type) {
    const classes = { security: 'badge-red', bug: 'badge-amber', abuse: 'badge-orange', other: 'badge-gray' };
    return classes[type] || 'badge-gray';
  },

  reportStatusLabel(status) {
    const labels = { open: '待處理', investigating: '調查中', resolved: '已解決', dismissed: '已忽略' };
    return labels[status] || status;
  },

  reportStatusClass(status) {
    const classes = { open: 'badge-amber', investigating: 'badge-blue', resolved: 'badge-green', dismissed: 'badge-gray' };
    return classes[status] || 'badge-gray';
  },

  async updateReportStatus(reportId, status) {
    if (!status) return;
    try {
      await api.put(`/admin/reports/${reportId}`, { status });
      await this.loadReports();
      showToast(`回報狀態已更新為：${this.reportStatusLabel(status)}`);
    } catch (e) {
      showToast('更新回報狀態失敗');
    }
  },

  // ── Anomaly Detection ──
  async loadAnomalyLogs(date) {
    const dateInput = $('#anomaly-date');
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
      if (dateInput) dateInput.value = date;
    }
    try {
      const res = await api.get(`/admin/anomaly-logs?date=${date}`);
      this.anomalyLogs = res.data?.events || [];
    } catch (e) {
      console.error('Failed to load anomaly logs:', e);
      this.anomalyLogs = [];
    }
    this.renderAnomalyLogs();
  },

  renderAnomalyLogs() {
    const el = $('#anomaly-list');
    if (!el) return;

    if (this.anomalyLogs.length === 0) {
      el.innerHTML = '<div class="empty-state"><h3>無異常記錄</h3><p class="text-muted">選定日期內未偵測到異常事件</p></div>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>類型</th>
              <th>IP</th>
              <th>國家</th>
              <th>時間</th>
              <th>詳情</th>
            </tr>
          </thead>
          <tbody>
            ${this.anomalyLogs.map(e => `
              <tr>
                <td><span class="badge ${this.anomalyTypeClass(e.type)}">${this.anomalyTypeLabel(e.type)}</span></td>
                <td><code>${escapeHtml(e.ip || '')}</code></td>
                <td>${escapeHtml(e.country || '')}</td>
                <td class="text-muted">${e.timestamp ? new Date(e.timestamp).toLocaleString('zh-TW') : ''}</td>
                <td class="text-sm" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(e.details || '')}">${escapeHtml(e.details || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  anomalyTypeLabel(type) {
    const labels = { rate_exceeded: '速率超限', auth_failed: '認證失敗', geo_change: '地理異常' };
    return labels[type] || type || '未知';
  },

  anomalyTypeClass(type) {
    const classes = { rate_exceeded: 'badge-red', auth_failed: 'badge-orange', geo_change: 'badge-amber' };
    return classes[type] || 'badge-gray';
  },

  // ── Disclosure Controls ──
  async expediteServer(serverId) {
    const reason = prompt('請輸入快速上架原因（至少 5 字）：');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) showToast('原因至少需要 5 個字');
      return;
    }
    try {
      await api.post(`/admin/disclosure/${serverId}/expedite`, { reason: reason.trim() });
      showToast('已快速上架');
      await Promise.all([this.loadReviewQueue(), this.renderStats()]);
    } catch (e) {
      showToast('快速上架失敗');
    }
  },

  async extendDisclosure(serverId) {
    const daysStr = prompt('延長天數（1-30）：', '3');
    const days = parseInt(daysStr, 10);
    if (!days || days < 1 || days > 30) {
      if (daysStr !== null) showToast('天數必須在 1-30 之間');
      return;
    }
    try {
      await api.post(`/admin/disclosure/${serverId}/extend`, { days });
      showToast(`已延長 ${days} 天`);
      await this.loadReviewQueue();
    } catch (e) {
      showToast('延長公示期失敗');
    }
  },

  // ── Recalculate Badges ──
  async recalculateBadges() {
    const btn = $('#recalc-badges-btn');
    if (btn) btn.disabled = true;
    try {
      const res = await api.post('/admin/recalculate-badges');
      const { total_checked, total_updated } = res.data;
      showToast(`已更新 ${total_updated} / ${total_checked} 個伺服器的社群徽章`);
    } catch (e) {
      showToast('重算社群徽章失敗');
    } finally {
      if (btn) btn.disabled = false;
    }
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  admin.init();
});
