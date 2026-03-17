// ============================================================
// upload.js — Upload wizard (real API)
// ============================================================

const upload = {
  currentStep: 1,
  totalSteps: 5,
  tools: [],

  stepLabels: ['基本資訊', '技術資訊', '安全聲明', '工具清單', '確認送出'],

  init() {
    if (!auth.user) {
      const content = $('#upload-content');
      if (content) content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <h3>請先登入</h3>
          <p class="text-muted mb-16">登入後才能上架 MCP 伺服器</p>
          <button class="btn btn-primary" onclick="auth.login()">登入</button>
        </div>`;
      return;
    }
    if (auth.user.role === 'user') {
      const content = $('#upload-content');
      if (content) content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👨‍💻</div>
          <h3>需要開發者權限</h3>
          <p class="text-muted mb-16">目前帳號為一般用戶，請聯繫管理員申請開發者角色</p>
          <a href="/" class="btn btn-secondary">回到市集</a>
        </div>`;
      return;
    }
    this.renderWizardSteps();
    this.renderTools();
  },

  renderWizardSteps() {
    const container = $('#wizard-steps');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= this.totalSteps; i++) {
      const cls = i === this.currentStep ? 'active' : (i < this.currentStep ? 'done' : '');
      html += `<div class="wizard-step ${cls}">
        <span class="step-num">${i < this.currentStep ? '✓' : i}</span>
        <span class="step-label">${this.stepLabels[i - 1]}</span>
      </div>`;
      if (i < this.totalSteps) {
        html += `<div class="wizard-connector ${i < this.currentStep ? 'done' : ''}"></div>`;
      }
    }
    container.innerHTML = html;
  },

  showStep(step) {
    for (let i = 1; i <= this.totalSteps; i++) {
      const panel = $(`#step-${i}`);
      if (panel) panel.classList.toggle('active', i === step);
    }
    this.currentStep = step;
    this.renderWizardSteps();

    const prevBtn = $('#wizard-prev');
    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';
    const nextBtn = $('#wizard-next');
    if (nextBtn) nextBtn.textContent = step === this.totalSteps ? '送出審核' : '下一步';

    if (step === this.totalSteps) {
      this.renderReviewSummary();
    }
  },

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (!this.validateStep(this.currentStep)) return;
      this.showStep(this.currentStep + 1);
    } else {
      this.handleSubmit();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.showStep(this.currentStep - 1);
    }
  },

  validateStep(step) {
    switch (step) {
      case 1: {
        const name = $('#w-name').value.trim();
        const slug = $('#w-slug').value.trim();
        const cat = $('#w-category').value;
        const ver = $('#w-version').value.trim();
        const desc = $('#w-description').value.trim();
        if (!name) { alert('請輸入伺服器名稱'); return false; }
        if (!slug) { alert('請輸入代稱'); return false; }
        if (!/^[a-z0-9-]+$/.test(slug)) { alert('代稱僅允許小寫英文、數字、連字號'); return false; }
        if (!cat) { alert('請選擇分類'); return false; }
        if (!ver) { alert('請輸入版本'); return false; }
        if (!desc || desc.length < 10) { alert('請輸入至少 10 字的說明'); return false; }
        return true;
      }
      case 2: {
        const endpoint = $('#w-endpoint').value.trim();
        if (!endpoint) { alert('請輸入 MCP 端點 URL'); return false; }
        try { new URL(endpoint); } catch { alert('請輸入有效的 URL'); return false; }
        return true;
      }
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  },

  // ── Tools Management ──
  addTool() {
    this.tools.push({ name: '', display_name: '', description: '', input_schema: '{}' });
    this.renderTools();
  },

  removeTool(idx) {
    this.tools.splice(idx, 1);
    this.renderTools();
  },

  updateTool(idx, field, value) {
    this.tools[idx][field] = value;
  },

  renderTools() {
    const container = $('#tools-list');
    if (!container) return;
    if (this.tools.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm">尚未新增任何工具，點擊下方按鈕新增。</p>';
      return;
    }

    container.innerHTML = this.tools.map((t, i) => `
      <div class="card mb-8" style="padding:12px;">
        <div class="flex items-center justify-between mb-8">
          <span class="text-sm font-bold">工具 ${i + 1}</span>
          <button class="btn btn-ghost btn-sm" onclick="upload.removeTool(${i})">✕</button>
        </div>
        <div class="form-group">
          <label>工具名稱 (function name)</label>
          <input type="text" value="${escapeHtml(t.name)}" placeholder="get_forecast" onchange="upload.updateTool(${i}, 'name', this.value)" />
        </div>
        <div class="form-group">
          <label>顯示名稱</label>
          <input type="text" value="${escapeHtml(t.display_name)}" placeholder="天氣預報" onchange="upload.updateTool(${i}, 'display_name', this.value)" />
        </div>
        <div class="form-group">
          <label>說明</label>
          <input type="text" value="${escapeHtml(t.description)}" placeholder="取得天氣預報資料" onchange="upload.updateTool(${i}, 'description', this.value)" />
        </div>
        <div class="form-group">
          <label>輸入參數 (JSON Schema)</label>
          <textarea rows="2" onchange="upload.updateTool(${i}, 'input_schema', this.value)">${escapeHtml(t.input_schema)}</textarea>
        </div>
      </div>
    `).join('');
  },

  // ── Review Summary ──
  renderReviewSummary() {
    const data = this.getFormData();
    const container = $('#review-summary');
    if (!container) return;

    container.innerHTML = `
      <div class="card mb-16">
        <h3 class="text-sm font-bold mb-8">基本資訊</h3>
        <table style="width:100%;font-size:0.875rem;">
          <tr><td class="text-muted" style="width:120px;">名稱</td><td>${escapeHtml(data.name)}</td></tr>
          <tr><td class="text-muted">代稱</td><td><code>${escapeHtml(data.slug)}</code></td></tr>
          <tr><td class="text-muted">分類</td><td>${categoryLabels[data.category] || data.category}</td></tr>
          <tr><td class="text-muted">版本</td><td>${escapeHtml(data.version)}</td></tr>
          <tr><td class="text-muted">說明</td><td>${escapeHtml(data.description)}</td></tr>
          <tr><td class="text-muted">標籤</td><td>${data.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</td></tr>
        </table>
      </div>
      <div class="card mb-16">
        <h3 class="text-sm font-bold mb-8">技術資訊</h3>
        <table style="width:100%;font-size:0.875rem;">
          <tr><td class="text-muted" style="width:120px;">端點</td><td><code>${escapeHtml(data.endpoint)}</code></td></tr>
          <tr><td class="text-muted">原始碼</td><td>${data.repo ? `<a href="${escapeHtml(data.repo)}" target="_blank">${escapeHtml(data.repo)}</a>` : '未提供'}</td></tr>
          <tr><td class="text-muted">授權</td><td>${escapeHtml(data.license) || '未指定'}</td></tr>
        </table>
      </div>
      <div class="card mb-16">
        <h3 class="text-sm font-bold mb-8">安全聲明</h3>
        <div class="badge-group mb-8">
          ${badges.render('data', data.badge_data)}
          ${badges.render('permission', data.badge_permission)}
          ${data.is_opensource ? badges.render('source', 'open') : badges.render('source', 'declared')}
        </div>
        ${data.external_urls.length > 0 ? `<p class="text-xs text-muted">外部連線：${data.external_urls.map(u => escapeHtml(u)).join(', ')}</p>` : ''}
      </div>
      <div class="card mb-16">
        <h3 class="text-sm font-bold mb-8">工具 (${data.tools.length})</h3>
        ${data.tools.length > 0 ? `
          <table style="width:100%;font-size:0.875rem;">
            <thead><tr><th>名稱</th><th>說明</th></tr></thead>
            <tbody>
              ${data.tools.map(t => `<tr><td><code>${escapeHtml(t.name)}</code></td><td>${escapeHtml(t.description)}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : '<p class="text-muted text-sm">未新增工具（審核時將自動偵測）</p>'}
      </div>
      <div class="alert alert-info">送出後，系統將自動掃描端點並指派安全徽章。審核通過後即可上架。</div>
    `;
  },

  getFormData() {
    return {
      name: $('#w-name').value.trim(),
      slug: $('#w-slug').value.trim(),
      category: $('#w-category').value,
      version: $('#w-version').value.trim(),
      description: $('#w-description').value.trim(),
      tags: $('#w-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      endpoint: $('#w-endpoint').value.trim(),
      repo: $('#w-repo').value.trim(),
      license: $('#w-license').value,
      badge_data: $('#w-data').value,
      badge_permission: $('#w-permission').value,
      external_urls: $('#w-external-urls').value.split('\n').map(u => u.trim()).filter(Boolean),
      is_opensource: $('#w-opensource').checked,
      tools: this.tools.filter(t => t.name),
    };
  },

  async handleSubmit() {
    const data = this.getFormData();
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      version: data.version,
      category: data.category,
      tags: data.tags,
      endpoint_url: data.endpoint,
      repo_url: data.repo || undefined,
      license: data.license || undefined,
      declared_data_sensitivity: data.badge_data,
      declared_permissions: data.badge_permission,
      declared_external_urls: data.external_urls,
      is_open_source: data.is_opensource,
    };

    try {
      const res = await api.post('/upload', payload);
      showToast('已送出審核申請！');
      const slug = res.data?.slug || data.slug;
      setTimeout(() => { window.location.href = `/server.html?slug=${slug}`; }, 1500);
    } catch (e) {
      const msg = e.error || '送出失敗，請稍後再試';
      showToast(msg);
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await auth.ready;
  upload.init();
});
