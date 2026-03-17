// ============================================================
// admin.js — Admin dashboard
// ============================================================

const admin = {
  reviewingServer: null,
  editingUser: null,

  init() {
    this.renderStats();
    this.loadReviewQueue();
    this.loadUsers();
    this.loadReports();
  },

  switchTab(tab) {
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  },

  // ── Stats ──
  renderStats() {
    const servers = mockData.servers;
    const users = mockData.adminUsers;
    const totalCalls = servers.reduce((sum, s) => sum + s.total_calls, 0);
    const pendingReviews = servers.filter(s =>
      ['pending_scan', 'scanning', 'scan_passed', 'pending_review'].includes(s.review_status)
    ).length;

    $('#admin-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${users.length}</div>
        <div class="stat-label">使用者</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${servers.length}</div>
        <div class="stat-label">伺服器</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${mockData.compositions.length}</div>
        <div class="stat-label">組合</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(totalCalls)}</div>
        <div class="stat-label">累計呼叫</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--color-warning);">${pendingReviews}</div>
        <div class="stat-label">待審核</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--color-danger);">${mockData.reports.filter(r => r.status === 'open').length}</div>
        <div class="stat-label">未處理回報</div>
      </div>
    `;
  },

  // ── Review Queue ──
  loadReviewQueue() {
    const pending = mockData.servers.filter(s =>
      ['pending_scan', 'scanning', 'scan_passed', 'pending_review'].includes(s.review_status)
    );
    const approved = mockData.servers.filter(s => s.review_status === 'approved');
    const all = [...pending, ...approved];

    if (all.length === 0) {
      $('#review-queue').innerHTML = '<div class="empty-state"><h3>沒有待審核的伺服器</h3></div>';
      return;
    }

    $('#review-queue').innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>伺服器</th>
              <th>版本</th>
              <th>作者</th>
              <th>徽章</th>
              <th>狀態</th>
              <th>提交日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${all.map(s => `
              <tr>
                <td>
                  <div class="font-bold">${escapeHtml(s.name)}</div>
                  <div class="text-xs text-muted">${escapeHtml(s.slug)}</div>
                </td>
                <td>${escapeHtml(s.version)}</td>
                <td>${escapeHtml(s.owner.display_name)}</td>
                <td>
                  <div class="badge-group">
                    ${badges.render('source', s.badge_source)}
                    ${badges.render('data', s.badge_data)}
                  </div>
                </td>
                <td><span class="badge ${reviewStatusClass(s.review_status)}">${reviewStatusLabels[s.review_status] || s.review_status}</span></td>
                <td class="text-muted">${timeAgo(s.created_at)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="admin.openReviewModal('${s.slug}')">檢視</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  openReviewModal(slug) {
    const server = mockData.servers.find(s => s.slug === slug);
    if (!server) return;
    this.reviewingServer = server;

    $('#review-modal-title').textContent = `審核：${server.name}`;

    const reviews = mockData.reviews[slug] || [];
    const isActionable = ['scan_passed', 'pending_review'].includes(server.review_status);

    $('#review-modal-body').innerHTML = `
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">基本資訊</div>
        <table style="width:100%;font-size:0.875rem;">
          <tr><td class="text-muted" style="width:100px;">名稱</td><td>${escapeHtml(server.name)}</td></tr>
          <tr><td class="text-muted">代稱</td><td><code>${escapeHtml(server.slug)}</code></td></tr>
          <tr><td class="text-muted">版本</td><td>${escapeHtml(server.version)}</td></tr>
          <tr><td class="text-muted">分類</td><td>${categoryLabels[server.category] || server.category}</td></tr>
          <tr><td class="text-muted">作者</td><td>${escapeHtml(server.owner.display_name)}</td></tr>
        </table>
      </div>
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">安全徽章</div>
        <div class="badge-group">
          ${badges.render('source', server.badge_source)}
          ${badges.render('data', server.badge_data)}
          ${badges.render('permission', server.badge_permission)}
          ${badges.render('community', server.badge_community)}
        </div>
      </div>
      <div class="mb-16">
        <div class="text-sm text-muted mb-4">說明</div>
        <p class="text-secondary text-sm">${escapeHtml(server.description)}</p>
      </div>
      ${reviews.length > 0 ? `
        <div>
          <div class="text-sm text-muted mb-4">審核歷程</div>
          <div class="timeline">
            ${reviews.map(r => `
              <div class="timeline-item ${r.status === 'done' ? 'success' : 'warning'}">
                <div class="text-sm"><strong>${escapeHtml(r.label)}</strong></div>
                <div class="time">${r.time || '等待中...'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Show/hide action buttons
    $('#review-approve-btn').style.display = isActionable ? 'block' : 'none';
    $('#review-reject-btn').style.display = isActionable ? 'block' : 'none';

    $('#review-detail-modal').classList.remove('hidden');
  },

  closeReviewModal() {
    $('#review-detail-modal').classList.add('hidden');
    this.reviewingServer = null;
  },

  handleReview(decision) {
    if (!this.reviewingServer) return;
    const action = decision === 'approved' ? '核准' : '拒絕';
    if (!confirm(`確定要${action}此伺服器？`)) return;

    this.reviewingServer.review_status = decision;
    if (decision === 'approved') {
      this.reviewingServer.is_published = true;
    }

    this.closeReviewModal();
    this.loadReviewQueue();
    this.renderStats();
    showToast(`已${action}：${this.reviewingServer.name}`);
  },

  // ── Users ──
  loadUsers() {
    const users = mockData.adminUsers;

    $('#user-list').innerHTML = `
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
            ${users.map(u => `
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
    const labels = { admin: '管理員', developer: '開發者', viewer: '檢視者' };
    return labels[role] || role;
  },

  planLabel(plan) {
    const labels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise', unlimited: 'Unlimited' };
    return labels[plan] || plan;
  },

  openEditUserModal(userId) {
    const user = mockData.adminUsers.find(u => u.id === userId);
    if (!user) return;
    this.editingUser = user;

    $('#edit-user-body').innerHTML = `
      <div class="form-group">
        <label>使用者</label>
        <input type="text" value="${escapeHtml(user.display_name)} (@${escapeHtml(user.username)})" disabled />
      </div>
      <div class="form-group">
        <label>角色</label>
        <select id="edit-role">
          <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>檢視者</option>
          <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>開發者</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理員</option>
        </select>
      </div>
      <div class="form-group">
        <label>方案</label>
        <select id="edit-plan">
          <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Free</option>
          <option value="pro" ${user.plan === 'pro' ? 'selected' : ''}>Pro</option>
          <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
          <option value="unlimited" ${user.plan === 'unlimited' ? 'selected' : ''}>Unlimited</option>
        </select>
      </div>
    `;

    $('#edit-user-modal').classList.remove('hidden');
  },

  closeEditUserModal() {
    $('#edit-user-modal').classList.add('hidden');
    this.editingUser = null;
  },

  saveUser() {
    if (!this.editingUser) return;
    const role = $('#edit-role').value;
    const plan = $('#edit-plan').value;

    this.editingUser.role = role;
    this.editingUser.plan = plan;

    this.closeEditUserModal();
    this.loadUsers();
    showToast('使用者已更新');
  },

  // ── Reports ──
  loadReports() {
    const reports = mockData.reports;

    if (reports.length === 0) {
      $('#report-list').innerHTML = '<div class="empty-state"><h3>沒有回報</h3></div>';
      return;
    }

    $('#report-list').innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>伺服器</th>
              <th>類型</th>
              <th>說明</th>
              <th>回報者</th>
              <th>狀態</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td><a href="/server.html?slug=${escapeHtml(r.server_slug)}">${escapeHtml(r.server_name)}</a></td>
                <td>${this.reportTypeLabel(r.type)}</td>
                <td class="text-secondary" style="max-width:200px;">${escapeHtml(r.description)}</td>
                <td class="text-muted">@${escapeHtml(r.reporter)}</td>
                <td><span class="badge ${r.status === 'open' ? 'badge-amber' : 'badge-green'}">${r.status === 'open' ? '未處理' : '已處理'}</span></td>
                <td class="text-muted">${timeAgo(r.created_at)}</td>
                <td>
                  ${r.status === 'open' ? `
                    <button class="btn btn-success btn-sm" onclick="admin.resolveReport('${r.id}')">標為已處理</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  reportTypeLabel(type) {
    const labels = { inaccurate: '資訊不正確', security: '安全問題', abuse: '濫用', other: '其他' };
    return labels[type] || type;
  },

  resolveReport(reportId) {
    const report = mockData.reports.find(r => r.id === reportId);
    if (!report) return;
    report.status = 'resolved';
    this.loadReports();
    this.renderStats();
    showToast('回報已標為已處理');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  admin.init();
});
