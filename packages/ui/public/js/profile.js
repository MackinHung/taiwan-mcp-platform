// ============================================================
// profile.js — Profile + API Keys (real API)
// ============================================================

const profile = {
  user: null,
  apiKeys: [],

  async init() {
    if (!auth.user) {
      const el = $('#profile-content');
      if (el) el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>請先登入</h3>
          <p class="text-muted mb-16">登入後即可查看個人資料與管理 API Keys</p>
          <button class="btn btn-primary" onclick="auth.login()">登入</button>
        </div>`;
      return;
    }
    this.user = auth.user;
    await this.loadApiKeys();
    this.render();
  },

  async loadApiKeys() {
    try {
      const res = await api.get('/keys');
      this.apiKeys = (res.data || []).map(k => ({
        ...k,
        prefix: k.key_prefix || k.prefix || '',
        permissions: parseJsonField(k.permissions),
        last_used: k.last_used_at || k.last_used || null,
      }));
    } catch (e) {
      console.error('Failed to load API keys:', e);
      this.apiKeys = [];
    }
  },

  render() {
    const u = this.user;
    const planLimits = {
      free: { calls: 1000, compositions: 3, keys: 5 },
      pro: { calls: 50000, compositions: 20, keys: 20 },
      enterprise: { calls: 500000, compositions: 100, keys: 100 },
      unlimited: { calls: Infinity, compositions: Infinity, keys: Infinity },
    };
    const limits = planLimits[u.plan] || planLimits.free;
    const usedCalls = u.monthly_calls || 0;

    $('#profile-content').innerHTML = `
      <!-- Profile Info -->
      <div class="card mb-24">
        <div class="flex items-center gap-16">
          <img src="${u.avatar_url || ''}" alt="avatar" style="width:64px;height:64px;border-radius:50%;border:3px solid var(--border);" />
          <div style="flex:1;">
            <h1 style="font-size:1.3rem;font-weight:700;">${escapeHtml(u.display_name)}</h1>
            <div class="text-sm text-secondary">@${escapeHtml(u.username)}</div>
            <div class="flex gap-8 mt-8">
              <span class="badge badge-blue">${this.roleLabel(u.role)}</span>
              <span class="badge badge-amber">${this.planLabel(u.plan)}</span>
            </div>
          </div>
          <button class="btn btn-ghost" onclick="auth.logout()">登出</button>
        </div>
      </div>

      <!-- Plan & Usage -->
      <div class="detail-section">
        <h2>方案與用量</h2>
        <div class="stats-grid mb-16">
          <div class="stat-card">
            <div class="stat-value">${formatNumber(usedCalls)} / ${limits.calls === Infinity ? '∞' : formatNumber(limits.calls)}</div>
            <div class="stat-label">月呼叫量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.apiKeys.length} / ${limits.keys === Infinity ? '∞' : limits.keys}</div>
            <div class="stat-label">API Keys</div>
          </div>
        </div>
        ${u.plan === 'free' ? `
          <div class="alert alert-info">
            升級至 <strong>Pro 方案</strong> 可獲得 50,000 月呼叫量、20 個組合。
            <button class="btn btn-primary btn-sm" style="margin-left:8px;" onclick="alert('方案升級功能開發中')">升級</button>
          </div>
        ` : ''}

        <!-- Usage Bar -->
        <div style="margin-top:12px;">
          <div class="flex justify-between text-xs text-muted mb-4">
            <span>本月呼叫量</span>
            <span>${usedCalls} / ${limits.calls === Infinity ? '無限制' : formatNumber(limits.calls)}</span>
          </div>
          <div style="height:8px;background:var(--bg-elevated);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(100, (usedCalls / limits.calls) * 100)}%;background:var(--color-primary);border-radius:4px;transition:width 0.3s;"></div>
          </div>
        </div>
      </div>

      <!-- API Keys -->
      <div class="detail-section">
        <div class="flex items-center justify-between">
          <h2 style="border:none;padding:0;margin:0;">API Keys</h2>
          <button class="btn btn-primary btn-sm" onclick="profile.openKeyModal()">+ 建立新 Key</button>
        </div>
        ${this.apiKeys.length > 0 ? `
          <div class="table-wrapper mt-16">
            <table>
              <thead>
                <tr>
                  <th>前綴</th>
                  <th>名稱</th>
                  <th>權限</th>
                  <th>最近使用</th>
                  <th>建立日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${this.apiKeys.map(k => `
                  <tr>
                    <td><code>${escapeHtml(k.prefix)}...</code></td>
                    <td>${escapeHtml(k.name)}</td>
                    <td>${k.permissions.map(p => `<span class="tag">${p}</span>`).join(' ')}</td>
                    <td class="text-muted">${timeAgo(k.last_used)}</td>
                    <td class="text-muted">${timeAgo(k.created_at)}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="profile.deleteKey('${k.id}')" style="color:var(--color-danger);">刪除</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="text-muted mt-16">尚未建立任何 API Key</p>'}
      </div>

      <!-- Account Info -->
      <div class="detail-section">
        <h2>帳號資訊</h2>
        <table style="width:100%;font-size:0.875rem;">
          <tr><td class="text-muted" style="width:120px;">帳號 ID</td><td><code>${escapeHtml(u.id)}</code></td></tr>
          <tr><td class="text-muted">建立日期</td><td>${new Date(u.created_at).toLocaleDateString('zh-TW')}</td></tr>
          <tr><td class="text-muted">登入方式</td><td>${this.loginMethodLabel(u)}</td></tr>
        </table>
      </div>
    `;
  },

  roleLabel(role) {
    const labels = { admin: '管理員', developer: '開發者', user: '一般用戶', viewer: '檢視者' };
    return labels[role] || role;
  },

  planLabel(plan) {
    const labels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise', unlimited: 'Unlimited' };
    return labels[plan] || plan;
  },

  loginMethodLabel(user) {
    const methods = [];
    if (user.github_id) methods.push('GitHub');
    if (user.google_id) methods.push('Google');
    return methods.length > 0 ? methods.join(' + ') : 'OAuth';
  },

  // ── API Key Management ──
  openKeyModal() {
    const modal = $('#create-key-modal');
    if (modal) modal.classList.remove('hidden');
    const nameEl = $('#key-name');
    if (nameEl) nameEl.value = '';
    const expiryEl = $('#key-expiry');
    if (expiryEl) expiryEl.value = '';
    $$('#create-key-modal input[type="checkbox"]').forEach((cb, i) => {
      cb.checked = i < 2;
    });
  },

  closeKeyModal() {
    const modal = $('#create-key-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleCreateKey() {
    const name = $('#key-name').value.trim();
    if (!name) { alert('請輸入名稱'); return; }

    const permissions = [...$$('#create-key-modal input[type="checkbox"]:checked')].map(cb => cb.value);
    if (permissions.length === 0) { alert('請至少選擇一個權限'); return; }

    const expiryDays = $('#key-expiry').value;
    const now = new Date();
    const expiresAt = expiryDays
      ? new Date(now.getTime() + parseInt(expiryDays) * 86400000).toISOString()
      : undefined;

    try {
      const res = await api.post('/keys', { name, permissions, expires_at: expiresAt });
      this.closeKeyModal();

      // Show the full key (only available once)
      const fullKey = res.data?.key;
      if (fullKey) {
        const keyValueEl = $('#new-key-value');
        if (keyValueEl) keyValueEl.textContent = fullKey;
        const createdModal = $('#key-created-modal');
        if (createdModal) createdModal.classList.remove('hidden');
      }

      await this.loadApiKeys();
      this.render();
    } catch (e) {
      showToast('建立 API Key 失敗');
    }
  },

  async deleteKey(keyId) {
    if (!confirm('確定要刪除此 API Key？此操作無法復原。')) return;
    try {
      await api.delete(`/keys/${keyId}`);
      await this.loadApiKeys();
      this.render();
      showToast('API Key 已刪除');
    } catch (e) {
      showToast('刪除 API Key 失敗');
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  profile.init();
});
