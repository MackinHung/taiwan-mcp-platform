// ============================================================
// admin.js — Admin dashboard (real API)
// ============================================================

const admin = {
  reviewingServer: null,
  editingUser: null,
  reviewQueue: [],
  users: [],
  reports: [],

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
                <td><span class="badge ${reviewStatusClass(s.review_status)}">${reviewStatusLabels[s.review_status] || s.review_status}</span></td>
                <td class="text-muted">${timeAgo(s.created_at)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="admin.openReviewModal('${s.id}')">檢視</button>
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
        </div>
      </div>
      ${isActionable ? `
        <div class="form-group">
          <label>審核備註（選填）</label>
          <textarea id="review-notes" rows="3" placeholder="審核備註..."></textarea>
        </div>
      ` : ''}
    `;

    const approveBtn = $('#review-approve-btn');
    const rejectBtn = $('#review-reject-btn');
    if (approveBtn) approveBtn.style.display = isActionable ? 'block' : 'none';
    if (rejectBtn) rejectBtn.style.display = isActionable ? 'block' : 'none';

    const modal = $('#review-detail-modal');
    if (modal) modal.classList.remove('hidden');
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
    const labels = { free: 'Free', developer: 'Developer', pro: 'Pro', team: 'Team', enterprise: 'Enterprise', unlimited: 'Unlimited' };
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
          <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Free</option>
          <option value="developer" ${user.plan === 'developer' ? 'selected' : ''}>Developer</option>
          <option value="team" ${user.plan === 'team' ? 'selected' : ''}>Team</option>
          <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
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
    // Reports don't have a dedicated admin list endpoint yet,
    // so we show a placeholder. This can be enhanced later.
    const el = $('#report-list');
    if (!el) return;
    el.innerHTML = '<div class="empty-state"><h3>回報管理功能開發中</h3><p class="text-muted">用戶的回報目前直接存入資料庫，稍後將加入管理介面</p></div>';
  },

  reportTypeLabel(type) {
    const labels = { security: '安全問題', bug: '錯誤', abuse: '濫用', other: '其他' };
    return labels[type] || type;
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  admin.init();
});
