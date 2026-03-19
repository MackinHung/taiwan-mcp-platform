// ============================================================
// app.js — Shared utilities for MCP Platform UI
// ============================================================

const API_BASE = '/api';

// ── SVG Icons (Lucide-style, 24x24) ────────────────────────
const icons = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  shieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" opacity="0.1"/><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  wrench: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2"/><circle cx="12" cy="12" r="3"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  lockOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
  fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
  helpCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  xCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  alertTriangle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  trendingUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/><circle cx="22" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>',
  package: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  flag: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>',
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  server: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
  compass: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  layers: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22.54 12.43-1.42-.65-8.28 3.78a2 2 0 0 1-1.66 0l-8.29-3.78-1.42.65a1 1 0 0 0 0 1.84l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.85Z"/></svg>',
  // ── Badge icons — semi-filled, unified, optimized for 14px ──
  // Style: stroke outline + filled accents on key elements
  // Source dimension (code visibility)
  code: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  clipboardCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" fill="currentColor" opacity="0.2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>',
  eyeOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="m3 21 18-18" stroke-width="2.5"/></svg>',
  // Data dimension (what data it touches)
  globe: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  keyRound: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="9" r="5"/><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/><path d="M11.3 12.7 4 20"/><path d="m4 20 3-1 1 3"/></svg>',
  userRound: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5" fill="currentColor" opacity="0.15"/><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>',
  fingerprint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12a10 10 0 0 1 18-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 12 0c0 3-1 5.5-2.5 7.5"/><path d="M12 10a2 2 0 0 0-2 2c0 1.5-.2 3-.6 4.5"/></svg>',
  // Permission dimension (what it can do)
  pencilLine: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/><circle cx="4.5" cy="19.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
  penSquare: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.1"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 15 2 .5.5 2 5-5-2.5-2.5z" fill="currentColor" opacity="0.3"/><path d="M16.475 5.525a1.5 1.5 0 0 1 2 2L10 16l-3 1 1-3z"/></svg>',
  terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="7 15 11 11 7 7"/><line x1="13" x2="17" y1="15" y2="15"/></svg>',
  // Community dimension (trust level)
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="currentColor" opacity="0.15"/><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>',
  flame: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  award: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6" fill="currentColor" opacity="0.15"/><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>',
  // External dimension (third-party verification)
  badgeCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="currentColor" opacity="0.1"/><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>',
  shieldAlert: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" opacity="0.1"/><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></svg>',
  circleDot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/></svg>',
  shieldX: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="currentColor" opacity="0.1"/><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>',
};

// ── Auth State ──────────────────────────────────────────────
const auth = {
  user: null,
  _readyResolve: null,
  ready: null,

  _initReadyPromise() {
    this.ready = new Promise((resolve) => {
      this._readyResolve = resolve;
    });
  },

  async init() {
    try {
      const res = await api.get('/auth/me');
      this.user = res.data;
    } catch {
      this.user = null;
    } finally {
      this.updateUI();
      if (this._readyResolve) this._readyResolve();
    }
  },

  updateUI() {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (this.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userAvatar) userAvatar.src = this.user.avatar_url || '';
      if (userName) userName.textContent = this.user.display_name || this.user.username;
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
    // Reveal auth UI after state resolved — prevents login button flash
    document.documentElement.classList.add('auth-ready');
  },

  login() {
    this.showLoginModal();
  },

  showLoginModal() {
    // Remove existing modal if present
    const existing = document.getElementById('login-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'login-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;text-align:center;">
        <div class="modal-header" style="justify-content:center;position:relative;">
          <h2>登入 MCP 市集</h2>
          <button class="modal-close" style="position:absolute;right:0;top:0;" onclick="document.getElementById('login-modal').remove()">&times;</button>
        </div>
        <p class="text-secondary text-sm" style="margin-bottom:20px;">選擇登入方式以繼續</p>
        <div class="login-providers">
          <button class="btn btn-login-github w-full" onclick="window.location.href='${API_BASE}/auth/github'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            使用 GitHub 登入
          </button>
          <button class="btn btn-login-google w-full" onclick="window.location.href='${API_BASE}/auth/google'" style="margin-top:10px;">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            使用 Google 登入
          </button>
        </div>
      </div>
    `;
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  async logout() {
    await api.post('/auth/logout');
    this.user = null;
    this.updateUI();
    window.location.href = '/';
  },

  requireLogin() {
    if (!this.user) {
      this.showLoginModal();
      return false;
    }
    return true;
  },

  requireRole(role) {
    if (!this.requireLogin()) return false;
    if (this.user.role !== role && this.user.role !== 'admin') {
      alert('權限不足');
      return false;
    }
    return true;
  }
};

// Initialize the ready promise immediately
auth._initReadyPromise();

// ── API Wrapper ─────────────────────────────────────────────
const api = {
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '60';
      showToast(`請求過於頻繁，請於 ${retryAfter} 秒後重試`);
      throw { status: 429, retryAfter: Number(retryAfter), ...data };
    }
    if (res.status === 402) {
      showToast('已達月度用量上限，請稍後再試');
      throw { status: 402, ...data };
    }

    if (!res.ok) {
      throw { status: res.status, ...data };
    }
    return data;
  },
  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
};

// ── Badge Rendering ─────────────────────────────────────────
const badgeTooltips = {
  source: {
    open_audited: '程式碼公開且通過自動安全掃描',
    open: '程式碼公開，可自行檢視',
    declared: '作者已聲明行為，但無法獨立驗證',
    undeclared: '未公開程式碼，平台無法驗證實際行為',
  },
  data: {
    public: '僅使用公開資訊，不接觸你的個人帳號或隱私資料',
    account: '需要帳號資料（如 API Key）才能運作',
    personal: '會存取個人資料 — 請確認隱私聲明',
    sensitive: '會處理身分證、健康等敏感資料 — 請詳閱隱私聲明',
  },
  permission: {
    readonly: '只能讀取資料，無法代你修改或刪除任何內容',
    limited_write: '可進行有限寫入 — 操作範圍受限',
    full_write: '可代你執行寫入操作 — 請確認你信任此來源',
    system: '可存取底層系統功能 — 僅限進階用戶使用',
  },
  community: {
    new: '新上架，尚無足夠使用數據評估',
    rising: '使用量穩定成長，100+ 次呼叫',
    popular: '高使用量的熱門伺服器，1,000+ 次呼叫',
    trusted: '經長期驗證的信賴伺服器，10,000+ 次呼叫且 50+ 收藏',
  },
  external: {
    verified: '通過 OSV + OpenSSF Scorecard 驗證，無已知漏洞',
    partial: '部分通過驗證，無高風險漏洞',
    unverified: '尚未進行第三方驗證',
    failed: '第三方驗證發現高風險漏洞',
  },
};

const badges = {
  source: {
    open_audited: { label: '開源已審計', icon: icons.shieldCheck, class: 'badge-green' },
    open: { label: '開源', icon: icons.code, class: 'badge-blue' },
    declared: { label: '已聲明', icon: icons.clipboardCheck, class: 'badge-amber' },
    undeclared: { label: '未聲明', icon: icons.eyeOff, class: 'badge-gray' },
  },
  data: {
    public: { label: '公開資料', icon: icons.globe, class: 'badge-green' },
    account: { label: '帳號資料', icon: icons.keyRound, class: 'badge-yellow' },
    personal: { label: '個人資料', icon: icons.userRound, class: 'badge-orange' },
    sensitive: { label: '敏感資料', icon: icons.fingerprint, class: 'badge-red' },
  },
  permission: {
    readonly: { label: '唯讀', icon: icons.eye, class: 'badge-green' },
    limited_write: { label: '有限寫入', icon: icons.pencilLine, class: 'badge-yellow' },
    full_write: { label: '完整寫入', icon: icons.penSquare, class: 'badge-orange' },
    system: { label: '系統權限', icon: icons.terminal, class: 'badge-red' },
  },
  community: {
    new: { label: '新上架', icon: icons.sparkles, class: 'badge-gray' },
    rising: { label: '成長中', icon: icons.trendingUp, class: 'badge-green' },
    popular: { label: '熱門', icon: icons.flame, class: 'badge-blue' },
    trusted: { label: '信賴', icon: icons.award, class: 'badge-gold' },
  },
  external: {
    verified: { label: '第三方驗證', icon: icons.badgeCheck, class: 'badge-green' },
    partial: { label: '部分驗證', icon: icons.shieldAlert, class: 'badge-amber' },
    unverified: { label: '未驗證', icon: icons.circleDot, class: 'badge-gray' },
    failed: { label: '驗證失敗', icon: icons.shieldX, class: 'badge-red' },
  },

  render(type, value) {
    const badge = this[type]?.[value];
    if (!badge) return '';
    const tooltip = badgeTooltips[type]?.[value] || badge.label;
    return `<span class="badge ${badge.class}"><span class="icon icon-sm">${badge.icon}</span> ${badge.label}<span class="badge-tip">${tooltip}</span></span>`;
  },

  renderAll(server) {
    return `
      <div class="card-badges">
        <div class="badge-group">
          ${this.render('source', server.badge_source)}
          ${this.render('data', server.badge_data)}
          ${this.render('permission', server.badge_permission)}
          ${this.render('community', server.badge_community)}
          ${server.badge_external ? this.render('external', server.badge_external) : ''}
        </div>
      </div>
    `;
  },

  renderCardSummary(server) {
    const items = [];
    const dataB = this.data[server.badge_data];
    const permB = this.permission[server.badge_permission];
    const srcB = this.source[server.badge_source];
    const comB = this.community[server.badge_community];

    if (dataB) items.push(dataB.label);
    if (permB) items.push(permB.label);
    if (srcB) items.push(srcB.label);
    if (comB) items.push(comB.label);

    const tg = calculateTrustGrade(server);
    const dotClass = 'dot-' + tg.grade.toLowerCase();

    return `<div class="badge-summary"><span class="summary-dot ${dotClass}"></span>${items.join('<span class="sep"> · </span>')}</div>`;
  }
};

// ── Theme Toggle ────────────────────────────────────────────
const theme = {
  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateIcon();
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateIcon();
  },
  updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = `<span class="icon">${isDark ? icons.sun : icons.moon}</span>`;
  }
};

// ── Helpers ──────────────────────────────────────────────────
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(n) {
  if (n == null) return '0';
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 個月前`;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已複製到剪貼簿');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.classList.add('visible');
    setTimeout(() => { toast.classList.remove('visible'); }, 2500);
  });
}

function parseJsonField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function animateCounter(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();
  const update = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = formatNumber(current);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function calculateTrustGrade(server) {
  const scoreMap = {
    source: { open_audited: 4, open: 3, declared: 2, undeclared: 1 },
    data: { public: 4, account: 3, personal: 2, sensitive: 1 },
    permission: { readonly: 4, limited_write: 3, full_write: 2, system: 1 },
    community: { trusted: 4, popular: 3, rising: 2, new: 1 },
  };
  const score =
    (scoreMap.source[server.badge_source] || 1) +
    (scoreMap.data[server.badge_data] || 1) +
    (scoreMap.permission[server.badge_permission] || 1) +
    (scoreMap.community[server.badge_community] || 1);

  if (score >= 14) return { grade: 'A', label: '高度信任', class: 'trust-grade-a', tip: '信任 A — 高度信任（' + score + '/16）' };
  if (score >= 11) return { grade: 'B', label: '良好', class: 'trust-grade-b', tip: '信任 B — 良好（' + score + '/16）' };
  if (score >= 8)  return { grade: 'C', label: '建議審閱', class: 'trust-grade-c', tip: '信任 C — 建議審閱（' + score + '/16）' };
  return { grade: 'D', label: '風險較高', class: 'trust-grade-d', tip: '信任 D — 風險較高（' + score + '/16）' };
}

function toggleMobileMenu() {
  const overlay = document.getElementById('mobile-menu-overlay');
  const menu = document.getElementById('mobile-menu');
  if (overlay && menu) {
    const isOpen = menu.classList.contains('open');
    overlay.classList.toggle('open', !isOpen);
    menu.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }
}

function closeMobileMenu() {
  const overlay = document.getElementById('mobile-menu-overlay');
  const menu = document.getElementById('mobile-menu');
  if (overlay) overlay.classList.remove('open');
  if (menu) menu.classList.remove('open');
  document.body.style.overflow = '';
}

function initScrollToTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', '回到頂部');
  btn.innerHTML = icons.arrowUp;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
}

function renderNav(activePage) {
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo">🇹🇼 MCP 市集</a>
      <div class="nav-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="global-search" placeholder="搜尋 MCP 伺服器..." />
      </div>
      <div class="nav-links">
        <a href="/" class="${activePage === 'home' ? 'active' : ''}">探索</a>
        <a href="/#guide" class="hide-mobile">指南</a>
        <a href="/my-mcp.html" class="${activePage === 'my-mcp' ? 'active' : ''} hide-mobile">我的 MCP</a>
        <a href="/my-servers.html" class="${activePage === 'my-servers' ? 'active' : ''} hide-mobile">我的伺服器</a>
        <a href="/upload.html" class="${activePage === 'upload' ? 'active' : ''} hide-mobile">上架</a>
        <a href="/trust.html" class="${activePage === 'trust' ? 'active' : ''} hide-mobile">信任與安全</a>
        <button id="theme-toggle" class="btn btn-ghost btn-icon" onclick="theme.toggle()" title="切換主題">☀️</button>
        <button id="login-btn" class="btn btn-primary btn-sm" onclick="auth.login()">登入</button>
        <div id="user-menu" style="display:none;">
          <a href="/profile.html"><img id="user-avatar" src="" alt="avatar" /></a>
          <span id="user-name"></span>
        </div>
      </div>
    </div>
  </nav>`;
}

// Category labels
const categoryLabels = {
  all: '全部',
  government: '政府',
  finance: '金融',
  utility: '公用事業',
  social: '社群',
  education: '教育',
  health: '醫療',
  other: '其他',
};

// Review status labels
const reviewStatusLabels = {
  pending_scan: '等待掃描',
  scanning: '掃描中',
  scan_passed: '掃描通過',
  scan_failed: '掃描失敗',
  pending_review: '等待審核',
  approved: '已核准',
  rejected: '已拒絕',
};

function reviewStatusClass(status) {
  if (status === 'approved' || status === 'scan_passed') return 'badge-green';
  if (status === 'rejected' || status === 'scan_failed') return 'badge-red';
  if (status === 'scanning') return 'badge-blue';
  return 'badge-amber';
}

// ── Onboarding Band (Quick Start) ────────────────────────────
const guide = {
  STORAGE_KEY: 'onboarding-dismissed',

  init() {
    const band = document.getElementById('onboarding-band');
    if (!band) return;

    if (localStorage.getItem(this.STORAGE_KEY) === 'true') {
      band.classList.add('hidden');
      return;
    }

    const dismissBtn = document.getElementById('onboarding-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.dismiss());
    }

    const ctaBtn = document.getElementById('onboarding-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const grid = document.getElementById('server-grid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (window.location.hash === '#guide') {
      this.scrollToGuide();
    }
  },

  dismiss() {
    const band = document.getElementById('onboarding-band');
    if (!band) return;

    band.style.transition = 'opacity 0.3s ease, max-height 0.4s ease 0.1s';
    band.style.opacity = '0';
    band.style.maxHeight = band.offsetHeight + 'px';

    requestAnimationFrame(() => {
      band.style.maxHeight = '0';
      band.style.padding = '0 16px';
      band.style.borderWidth = '0';
      band.style.overflow = 'hidden';
    });

    setTimeout(() => {
      band.classList.add('hidden');
      band.removeAttribute('style');
    }, 500);

    localStorage.setItem(this.STORAGE_KEY, 'true');
  },

  show() {
    localStorage.removeItem(this.STORAGE_KEY);
    const band = document.getElementById('onboarding-band');
    if (band) {
      band.classList.remove('hidden');
      band.removeAttribute('style');
    }
  },

  scrollToGuide() {
    const band = document.getElementById('onboarding-band');
    if (!band) return;
    if (band.classList.contains('hidden')) this.show();
    setTimeout(() => band.scrollIntoView({ behavior: 'smooth' }), 100);
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
  theme.init();
  auth.init();
  guide.init();
  initScrollToTop();
});
