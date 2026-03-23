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
      : daysLeft > 0
        ? `${daysLeft} 天後自動上架`
        : `${hoursLeft} 小時後自動上架`;

    const tags = typeof server.tags === 'string' ? JSON.parse(server.tags) : (server.tags || []);

    return `
      <div class="card" style="margin-bottom:1rem;padding:1.5rem;border-radius:12px;background:var(--card-bg);border:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <h3 style="margin:0;"><a href="/server.html?slug=${server.slug}" style="color:var(--text-primary);text-decoration:none;">${escapeHtml(server.name)}</a></h3>
            <p style="margin:0.25rem 0;color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(server.description || '')}</p>
          </div>
          <div style="text-align:right;">
            <span class="badge" data-ends="${server.disclosure_ends_at}" style="font-weight:600;color:var(--primary);">${countdownText}</span>
            <div style="font-size:0.8rem;color:var(--text-secondary);">v${escapeHtml(server.version)}</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="margin:1rem 0 0.75rem;height:6px;border-radius:3px;background:var(--border);">
          <div style="height:100%;border-radius:3px;background:var(--primary);width:${progress}%;transition:width 1s;"></div>
        </div>

        <!-- Votes & Reports -->
        <div style="display:flex;gap:1.5rem;font-size:0.9rem;color:var(--text-secondary);flex-wrap:wrap;">
          <span title="信任票">&#x1F44D; ${server.trust_votes || 0}</span>
          <span title="不信任票">&#x1F44E; ${server.distrust_votes || 0}</span>
          <span title="安全回報" style="${(server.open_reports || 0) > 0 ? 'color:var(--danger);font-weight:600;' : ''}">&#x1F6A8; ${server.open_reports || 0} 安全回報</span>
          ${tags.length > 0 ? `<span>${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</span>` : ''}
          <span>by ${escapeHtml(server.owner_display_name || server.owner_username || 'unknown')}</span>
        </div>

        <!-- Badges -->
        <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${badgeHtml('source', server.badge_source)}
          ${badgeHtml('data', server.badge_data)}
          ${badgeHtml('permission', server.badge_permission)}
          ${server.badge_external ? badgeHtml('external', server.badge_external) : ''}
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
        : daysLeft > 0
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
