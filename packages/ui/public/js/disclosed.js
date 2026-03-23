// Disclosure Period — public page
(function () {
  'use strict';

  const API = window.API_BASE || '';

  async function loadDisclosed() {
    const container = document.getElementById('disclosed-list');
    const emptyState = document.getElementById('empty-state');

    try {
      const res = await fetch(`${API}/api/disclosure`, { credentials: 'include' });
      const json = await res.json();

      if (!json.success || !json.data || json.data.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      container.innerHTML = json.data.map(renderCard).join('');

      // Start countdown timers
      updateCountdowns();
      setInterval(updateCountdowns, 60000);
    } catch {
      container.innerHTML = '<p style="color:var(--danger);">載入失敗，請重新整理。</p>';
    }
  }

  function renderCard(server) {
    const now = Date.now();
    const start = new Date(server.disclosed_at).getTime();
    const end = new Date(server.disclosure_ends_at).getTime();
    const totalMs = end - start;
    const elapsedMs = now - start;
    const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const remaining = Math.max(0, end - now);
    const daysLeft = Math.ceil(remaining / 86400000);
    const hoursLeft = Math.ceil(remaining / 3600000);

    const countdownText = remaining <= 0
      ? '即將上架'
      : remaining > 86400000
        ? `${daysLeft} 天後自動上架`
        : `${hoursLeft} 小時後自動上架`;

    const tags = typeof server.tags === 'string' ? JSON.parse(server.tags) : (server.tags || []);

    return `
      <div class="card mb-16" style="padding:32px 24px; position: relative; overflow: hidden;">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:1.5rem;">
          <div>
            <h3 style="margin:0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em;">
              <a href="/server.html?slug=${server.slug}" style="color:var(--text-primary);text-decoration:none;">${escapeHtml(server.name)}</a>
            </h3>
            <p style="margin:0.5rem 0 0; color:var(--text-secondary); font-size:1rem; line-height: 1.5;">${escapeHtml(server.description || '')}</p>
          </div>
          <div style="text-align:right;">
            <span class="badge" data-ends="${server.disclosure_ends_at}" style="font-weight:600; color:var(--bg); background: var(--text-primary); padding: 6px 16px; border-radius: 999px;">${countdownText}</span>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top: 8px; font-family: monospace;">v${escapeHtml(server.version)}</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="margin:1.5rem 0; height:4px; border-radius:2px; background:var(--bg-elevated); overflow: hidden;">
          <div style="height:100%; border-radius:2px; background:var(--text-primary); width:${progress}%; transition:width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>

        <!-- Votes & Reports & Badges -->
        <div style="display:flex; justify-content: space-between; align-items: center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; gap:1.5rem; font-size:0.95rem; color:var(--text-secondary); align-items: center;">
            <span title="信任票" style="display:flex; align-items:center; gap:6px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              <strong>${server.trust_votes || 0}</strong>
            </span>
            <span title="不信任票" style="display:flex; align-items:center; gap:6px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              <strong>${server.distrust_votes || 0}</strong>
            </span>
            <span title="安全回報" style="display:flex; align-items:center; gap:6px; ${(server.open_reports || 0) > 0 ? 'color:var(--color-danger);font-weight:700;' : ''}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>${server.open_reports || 0}</strong> 待處理
            </span>
          </div>

          <!-- Badges -->
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            ${badgeHtml('source', server.badge_source)}
            ${badgeHtml('data', server.badge_data)}
            ${badgeHtml('permission', server.badge_permission)}
            ${server.badge_external ? badgeHtml('external', server.badge_external) : ''}
          </div>
        </div>
      </div>
    `;
  }

  function badgeHtml(type, value) {
    if (!value) return '';
    return `<span class="badge badge-${type}" style="font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:4px;background:var(--border);color:var(--text-secondary);">${type}: ${value}</span>`;
  }

  function updateCountdowns() {
    const badges = document.querySelectorAll('[data-ends]');
    const now = Date.now();
    badges.forEach(function (el) {
      const end = new Date(el.getAttribute('data-ends')).getTime();
      const remaining = Math.max(0, end - now);
      const daysLeft = Math.ceil(remaining / 86400000);
      const hoursLeft = Math.ceil(remaining / 3600000);
      el.textContent = remaining <= 0
        ? '即將上架'
        : remaining > 86400000
          ? daysLeft + ' 天後自動上架'
          : hoursLeft + ' 小時後自動上架';
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDisclosed);
  } else {
    loadDisclosed();
  }
})();
