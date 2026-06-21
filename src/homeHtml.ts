export const memoNoteHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MemoNote</title>
    <meta name="theme-color" content="#f4d36e" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="MemoNote" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/app-icon.svg" />
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f5ef;
        --surface: rgba(255, 255, 255, 0.82);
        --surface-strong: #ffffff;
        --surface-soft: #fbf8f0;
        --border: rgba(112, 96, 58, 0.12);
        --text: #1e1b16;
        --muted: #6f685f;
        --accent: #f0be3f;
        --accent-strong: #d99c0e;
        --danger: #c2410c;
        --shadow: 0 24px 60px rgba(74, 58, 28, 0.08);
      }
      :root[data-theme="warm"] {
        --bg: #f7f3e8;
        --surface: rgba(255, 248, 234, 0.84);
        --surface-strong: #fffaf0;
        --surface-soft: #fef7e4;
        --border: rgba(111, 88, 30, 0.12);
        --accent: #f2c14e;
        --accent-strong: #d79c12;
      }
      :root[data-theme="dark"] {
        color-scheme: dark;
        --bg: #111116;
        --surface: rgba(25, 26, 34, 0.82);
        --surface-strong: #1a1b23;
        --surface-soft: #20222d;
        --border: rgba(255, 255, 255, 0.08);
        --text: #f4f2ec;
        --muted: #b3ac9e;
        --accent: #f1c85e;
        --accent-strong: #f4d36e;
        --danger: #f97316;
        --shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        background:
          radial-gradient(circle at 0% 0%, rgba(244, 211, 110, 0.18), transparent 28%),
          radial-gradient(circle at 100% 0%, rgba(240, 190, 63, 0.09), transparent 25%),
          var(--bg);
        color: var(--text);
      }
      button, input, textarea, select { font: inherit; color: inherit; }
      button { cursor: pointer; }
      .hidden { display: none !important; }
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
      }
      .shell.sidebar-collapsed {
        grid-template-columns: 0 minmax(0, 1fr);
      }
      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 18px 16px 16px;
        border-right: 1px solid var(--border);
        background: var(--surface);
        backdrop-filter: blur(18px);
        transition: transform 0.18s ease, opacity 0.18s ease, padding 0.18s ease;
        display: flex;
        flex-direction: column;
        gap: 18px;
        overflow: auto;
      }
      .shell.sidebar-collapsed .sidebar {
        transform: translateX(-100%);
        opacity: 0;
        pointer-events: none;
        padding-left: 0;
        padding-right: 0;
        border-right: 0;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .brand-badge {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(145deg, #ffe79a, var(--accent));
        box-shadow: 0 10px 24px rgba(244, 211, 110, 0.28);
      }
      .brand-title {
        margin: 0;
        font-size: 24px;
        line-height: 1.1;
      }
      .brand-subtitle {
        margin-top: 2px;
        color: var(--muted);
        font-size: 12px;
      }
      .sidebar-section { margin-bottom: 0; display: grid; gap: 10px; }
      .sidebar-label {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .sidebar-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .pinned-notes {
        display: grid;
        gap: 8px;
      }
      .pinned-note {
        display: grid;
        gap: 4px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: var(--surface-strong);
        text-align: left;
      }
      .pinned-note:hover {
        background: var(--surface-soft);
      }
      .pinned-note-title {
        font-weight: 700;
        line-height: 1.25;
      }
      .pinned-note-meta {
        color: var(--muted);
        font-size: 12px;
      }
      .pinned-note-empty {
        color: var(--muted);
        font-size: 12px;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px dashed var(--border);
      }
      .btn {
        height: 40px;
        border: 0;
        border-radius: 12px;
        padding: 0 14px;
        background: linear-gradient(145deg, var(--accent), var(--accent-strong));
        color: #201a0c;
        font-weight: 700;
        box-shadow: 0 10px 20px rgba(240, 190, 63, 0.15);
      }
      .btn.secondary {
        background: var(--surface-strong);
        color: var(--text);
        border: 1px solid var(--border);
        box-shadow: none;
      }
      .btn.ghost {
        background: transparent;
        border: 1px solid var(--border);
        box-shadow: none;
      }
      .btn.danger {
        background: rgba(194, 65, 12, 0.12);
        color: var(--danger);
        box-shadow: none;
      }
      .btn.icon {
        width: 40px;
        padding: 0;
      }
      .sidebar-toggle {
        flex: 0 0 auto;
      }
      .segmented {
        display: flex;
        gap: 8px;
      }
      .segmented .btn { flex: 1; }
      .tag-list {
        display: grid;
        gap: 6px;
        max-height: 36vh;
        overflow: auto;
        padding-right: 4px;
      }
      .tag-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text);
        text-align: left;
      }
      .tag-item.active {
        background: rgba(244, 211, 110, 0.18);
        border-color: rgba(244, 211, 110, 0.26);
      }
      .tag-item span:last-child {
        color: var(--muted);
        font-size: 12px;
      }
      .sidebar-footer {
        margin-top: auto;
        display: grid;
        gap: 8px;
      }
      .main {
        min-width: 0;
        padding: 18px;
      }
      .topbar {
        position: sticky;
        top: 18px;
        z-index: 6;
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--surface);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
      }
      .topbar-left, .topbar-right {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .topbar-left {
        min-width: 0;
      }
      .topbar-right {
        position: relative;
      }
      .search {
        width: min(520px, 46vw);
        height: 40px;
        padding: 0 14px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--surface-strong);
        outline: none;
      }
      .search:focus,
      .input:focus,
      .textarea:focus {
        border-color: rgba(244, 211, 110, 0.7);
        box-shadow: 0 0 0 4px rgba(244, 211, 110, 0.12);
      }
      .content {
        padding-top: 16px;
        display: grid;
        gap: 16px;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 12px;
      }
      .section-title {
        margin: 0;
        font-size: 28px;
        line-height: 1.1;
      }
      .section-desc {
        margin-top: 6px;
        color: var(--muted);
        font-size: 13px;
      }
      .note-list,
      .gallery-grid {
        display: grid;
        gap: 12px;
      }
      .note-list {
        grid-template-columns: 1fr;
      }
      .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      }
      .group {
        display: grid;
        gap: 10px;
      }
      .group-label {
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
        padding-top: 4px;
      }
      .note-card {
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--surface);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .note-card.search-hit {
        border-color: rgba(244, 211, 110, 0.7);
        box-shadow: 0 0 0 1px rgba(244, 211, 110, 0.18), var(--shadow);
      }
      .note-card-inner {
        padding: 14px;
        display: grid;
        gap: 10px;
      }
      .note-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
      }
      .note-meta-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .pin-btn {
        width: 30px;
        height: 30px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid transparent;
        background: transparent;
        color: color-mix(in srgb, var(--muted) 80%, var(--text));
        flex: 0 0 auto;
      }
      .pin-btn:hover {
        background: var(--surface-soft);
      }
      .pin-btn.active {
        color: var(--accent-strong);
        background: rgba(244, 211, 110, 0.18);
        border-color: rgba(244, 211, 110, 0.24);
      }
      .note-title {
        margin: 0;
        font-size: 18px;
        line-height: 1.2;
        word-break: break-word;
      }
      .note-preview {
        color: color-mix(in srgb, var(--text) 84%, var(--muted));
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.6;
      }
      .note-preview h1,
      .note-preview h2,
      .note-preview h3,
      .note-preview h4,
      .note-preview h5,
      .note-preview h6 {
        margin: 0.9em 0 0.5em;
        line-height: 1.2;
      }
      .note-preview h1 { font-size: 1.55em; }
      .note-preview h2 { font-size: 1.35em; }
      .note-preview h3 { font-size: 1.18em; }
      .note-preview h4 { font-size: 1.05em; }
      .note-preview p {
        margin: 0 0 0.7em;
      }
      .note-preview blockquote {
        margin: 0.8em 0;
        padding: 0.15em 0 0.15em 0.9em;
        border-left: 3px solid rgba(244, 211, 110, 0.7);
        color: var(--muted);
      }
      .note-preview ul,
      .note-preview ol {
        margin: 0.7em 0;
        padding-left: 1.35em;
      }
      .note-preview li {
        margin: 0.2em 0;
      }
      .note-preview pre {
        margin: 0.9em 0;
        padding: 12px 14px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--surface-soft) 82%, #000 18%);
        overflow: auto;
        white-space: pre;
      }
      .note-preview code {
        padding: 0.15em 0.35em;
        border-radius: 6px;
        background: color-mix(in srgb, var(--surface-soft) 80%, #000 12%);
        font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, "Liberation Mono", monospace;
        font-size: 0.95em;
      }
      .note-preview pre code {
        padding: 0;
        background: transparent;
      }
      .note-preview a {
        color: var(--accent-strong);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .tag-row, .attachment-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        background: rgba(244, 211, 110, 0.16);
        color: color-mix(in srgb, var(--text) 80%, var(--accent));
        font-size: 12px;
      }
      .chip.muted {
        background: var(--surface-soft);
        color: var(--muted);
      }
      .chip.search-hit {
        background: rgba(244, 211, 110, 0.32);
        color: var(--text);
      }
      .search-mark {
        background: rgba(244, 211, 110, 0.55);
        color: inherit;
        border-radius: 4px;
        padding: 0 2px;
      }
      .attachment-thumb {
        width: 100%;
        border-radius: 14px;
        border: 1px solid var(--border);
        overflow: hidden;
        background: var(--surface-strong);
      }
      .attachment-thumb img {
        display: block;
        width: 100%;
        height: 180px;
        object-fit: cover;
      }
      .attachment-file {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--surface-strong);
        text-decoration: none;
        color: inherit;
      }
      .attachment-file small {
        color: var(--muted);
      }
      .note-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .note-actions .btn {
        height: 34px;
        padding: 0 11px;
        border-radius: 11px;
        font-size: 13px;
      }
      .note-menu {
        position: fixed;
        min-width: 200px;
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--surface-strong) 95%, #fff 5%);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
        display: none;
        z-index: 80;
        backdrop-filter: blur(18px);
      }
      .note-menu.open {
        display: grid;
        gap: 4px;
      }
      .note-menu button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 40px;
        padding: 0 12px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        text-align: left;
        font-size: 14px;
      }
      .note-menu button:hover {
        background: var(--surface-soft);
      }
      .note-menu .danger {
        color: var(--danger);
      }
      .note-menu-separator {
        height: 1px;
        margin: 4px 6px;
        background: var(--border);
      }
      .app-menu {
        position: fixed;
        min-width: 220px;
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: color-mix(in srgb, var(--surface-strong) 95%, #fff 5%);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
        display: none;
        z-index: 80;
        backdrop-filter: blur(18px);
      }
      .app-menu.open {
        display: grid;
        gap: 4px;
      }
      .app-menu .menu-label {
        padding: 8px 12px 4px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }
      .app-menu button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 40px;
        padding: 0 12px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        text-align: left;
        font-size: 14px;
      }
      .app-menu button:hover {
        background: var(--surface-soft);
      }
      .app-menu .active {
        background: rgba(244, 211, 110, 0.18);
      }
      .app-menu .danger {
        color: var(--danger);
      }
      .empty {
        padding: 34px 18px;
        border-radius: 18px;
        border: 1px dashed var(--border);
        text-align: center;
        color: var(--muted);
      }
      .loading-state {
        display: grid;
        gap: 10px;
        place-items: center;
        padding: 34px 18px;
        border-radius: 18px;
        border: 1px dashed var(--border);
        text-align: center;
        color: var(--muted);
      }
      .loading-dots {
        display: inline-flex;
        gap: 6px;
      }
      .loading-dots span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--accent);
        animation: pulse 1.1s infinite ease-in-out;
      }
      .loading-dots span:nth-child(2) { animation-delay: 0.12s; }
      .loading-dots span:nth-child(3) { animation-delay: 0.24s; }
      @keyframes pulse {
        0%, 80%, 100% { transform: scale(0.65); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      .error-banner {
        display: none;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(194, 65, 12, 0.26);
        background: rgba(194, 65, 12, 0.1);
        color: var(--danger);
        font-size: 13px;
      }
      .error-banner.show {
        display: block;
      }
      .draft-card {
        padding: 14px;
        border: 1px solid rgba(244, 211, 110, 0.3);
        background: rgba(244, 211, 110, 0.12);
        border-radius: 18px;
        display: grid;
        gap: 10px;
      }
      .input, .textarea, .select {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--surface-strong);
        padding: 0 14px;
        outline: none;
      }
      .input, .select { height: 44px; }
      .textarea {
        min-height: 220px;
        padding: 14px;
        resize: vertical;
      }
      .status {
        position: fixed;
        left: 50%;
        bottom: 22px;
        transform: translate(-50%, 12px);
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(22, 22, 28, 0.9);
        color: #fff;
        box-shadow: 0 14px 24px rgba(0, 0, 0, 0.18);
        opacity: 0;
        pointer-events: none;
        transition: opacity .18s ease, transform .18s ease;
        z-index: 40;
      }
      .status.show {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      .login {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at 50% 0%, rgba(244, 211, 110, 0.18), transparent 30%),
          rgba(247, 245, 239, 0.9);
        backdrop-filter: blur(16px);
        z-index: 60;
      }
      .login-card {
        width: min(440px, 100%);
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }
      .login-brand {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
      }
      .login-title { margin: 0; font-size: 28px; line-height: 1.1; }
      .login-desc { margin: 8px 0 18px; color: var(--muted); }
      .field-stack { display: grid; gap: 8px; margin-bottom: 12px; }
      .field-label { font-size: 13px; color: var(--muted); font-weight: 700; }
      .field-help { color: var(--muted); font-size: 12px; }
      .editor {
        position: fixed;
        inset: 0;
        z-index: 55;
        background: color-mix(in srgb, var(--bg) 24%, #111 76%);
        display: grid;
        place-items: center;
        padding: 18px;
      }
      .editor-card {
        width: min(1040px, 100%);
        max-height: min(94vh, 980px);
        overflow: auto;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--surface-strong);
        box-shadow: var(--shadow);
        padding: 18px;
      }
      .editor-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
      }
      .editor-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr;
      }
      .editor-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: space-between;
        align-items: center;
      }
      .editor-toolbar .left,
      .editor-toolbar .right {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .attachment-list {
        display: grid;
        gap: 8px;
      }
      .attachment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--surface-soft);
      }
      .attachment-item .meta {
        display: grid;
        gap: 2px;
      }
      .attachment-item .meta small {
        color: var(--muted);
      }
      .attachment-item a {
        color: inherit;
        text-decoration: none;
        font-weight: 700;
      }
      .editor-grid.preview-open {
        grid-template-columns: minmax(0, 1fr) 320px;
      }
      .editor-panel {
        display: grid;
        gap: 10px;
      }
      .theme-pills, .view-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill {
        border-radius: 999px;
        padding: 8px 12px;
        border: 1px solid var(--border);
        background: var(--surface-strong);
      }
      .pill.active {
        background: rgba(244, 211, 110, 0.16);
        border-color: rgba(244, 211, 110, 0.28);
      }
      .app-shell.hidden { display: none; }
      .shell.sidebar-collapsed .main {
        padding-left: 12px;
      }
      @media (max-width: 980px) {
        .shell { grid-template-columns: 1fr; }
        .sidebar {
          position: static;
          height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--border);
          overflow: visible;
        }
        .sidebar-footer { position: static; }
        .main { padding: 12px; }
        .topbar {
          top: 12px;
          flex-direction: column;
          align-items: stretch;
        }
        .topbar-left, .topbar-right {
          width: 100%;
        }
        .search { width: 100%; }
        .editor-grid.preview-open { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .main { padding: 10px; }
        .section-title { font-size: 24px; }
        .gallery-grid { grid-template-columns: 1fr; }
        .sidebar-actions { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div id="loginView" class="login">
      <div class="login-card">
        <div class="login-brand">
          <div class="brand-badge"></div>
          <div>
            <h1 class="login-title">MemoNote</h1>
            <div class="brand-subtitle">轻量私人笔记</div>
          </div>
        </div>
        <p class="login-desc">输入用户名和密码进入你的单用户笔记本。</p>
        <div class="field-stack">
          <label class="field-label" for="usernameInput">用户名</label>
          <input id="usernameInput" class="input" autocomplete="username" value="admin" />
        </div>
        <div class="field-stack">
          <label class="field-label" for="passwordInput">密码</label>
          <input id="passwordInput" class="input" type="password" autocomplete="current-password" placeholder="输入密码" />
        </div>
        <div class="field-stack">
          <button id="loginBtn" class="btn">进入 MemoNote</button>
        </div>
        <div class="field-help">默认用户名是 admin。附件会存到 Cloudflare R2，笔记数据保存在 D1。</div>
      </div>
    </div>

    <div id="appShell" class="app-shell hidden">
      <div class="shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-badge"></div>
            <div>
              <h2 class="brand-title">MemoNote</h2>
              <div id="accountLabel" class="brand-subtitle">已登录</div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">操作</div>
            <div class="sidebar-actions">
              <button id="newBtn" class="btn">新建</button>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">Pin</div>
            <div id="pinnedNotes" class="pinned-notes"></div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-label">标签</div>
            <div id="tagList" class="tag-list"></div>
          </div>

          <div class="sidebar-footer">
            <div id="storageStatus" class="field-help">搜索会覆盖标题、正文、标签和附件文件名。</div>
            <button id="refreshBtn" class="btn ghost">刷新</button>
          </div>
        </aside>

        <main class="main">
          <header class="topbar">
            <div class="topbar-left">
              <button id="sidebarToggleBtn" class="btn secondary icon sidebar-toggle" aria-label="隐藏左侧栏">‹</button>
              <div>
                <h1 class="section-title">笔记</h1>
                <div id="summaryText" class="section-desc">按更新时间排序。</div>
              </div>
            </div>
            <div class="topbar-right">
              <input id="searchInput" class="search" placeholder="搜索标题、正文、标签、附件文件名" />
              <button id="clearSearchBtn" class="btn secondary">清空</button>
              <button id="menuBtn" class="btn secondary icon" aria-label="更多操作">⋯</button>
            </div>
          </header>

          <section class="content">
            <div id="errorBanner" class="error-banner"></div>
            <div id="noteList"></div>
          </section>
        </main>
      </div>
    </div>

    <div id="editorView" class="editor hidden">
      <div class="editor-card">
        <div class="editor-head">
          <div>
            <h2 id="editorTitle" class="section-title">新建笔记</h2>
            <div id="editorHint" class="section-desc">内容会自动保存，保存后可以继续上传图片、PDF 和 Office 文件。</div>
          </div>
          <div class="topbar-right">
            <button id="previewToggleBtn" class="btn secondary">预览</button>
            <button id="closeEditorBtn" class="btn secondary">关闭</button>
          </div>
        </div>

        <div id="editorGrid" class="editor-grid">
          <div class="editor-panel">
            <input id="noteTitleInput" class="input" placeholder="标题" />
            <textarea id="noteContentInput" class="textarea" placeholder="今天记点什么"></textarea>
            <input id="noteTagsInput" class="input" placeholder="标签，用逗号分隔，例如 工作, 截图, 旅行" />
            <div class="editor-toolbar">
              <div class="left">
                <button id="deleteNoteBtn" class="btn danger">删除</button>
              </div>
              <div class="right">
                <input id="attachmentInput" type="file" multiple class="hidden" />
                <button id="pickAttachmentBtn" class="btn secondary">添加附件</button>
              </div>
            </div>
            <div id="attachmentSection" class="attachment-list"></div>
          </div>

          <div id="editorPreviewPanel" class="editor-panel hidden">
            <div class="sidebar-label">预览</div>
            <div id="previewPanel" class="note-card">
              <div class="note-card-inner">
                <div class="note-meta"><span>实时预览</span><span id="previewCount">0 字</span></div>
                <h3 id="previewTitle" class="note-title">未命名</h3>
                <div id="previewTags" class="tag-row"></div>
                <div id="previewBody" class="note-preview"></div>
                <div id="previewAttachments" class="attachment-row"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="noteMenu" class="note-menu" aria-hidden="true"></div>
    <div id="appMenu" class="app-menu" aria-hidden="true"></div>
    <div id="status" class="status"></div>

    <script>
      const state = {
        session: null,
        notes: [],
        filtered: [],
        theme: localStorage.getItem('memonote:theme') || 'light',
        activeTag: localStorage.getItem('memonote:activeTag') || 'all',
        sidebarCollapsed: localStorage.getItem('memonote:sidebarCollapsed') === '1',
        query: '',
        editing: null,
        loading: false,
        error: '',
        statusTimer: null,
        uploadQueue: [],
        noteMenu: null,
        autosaveTimer: null,
        lastSavedEditorSignature: '',
      };

      const els = {
        loginView: document.getElementById('loginView'),
        appShell: document.getElementById('appShell'),
        editorView: document.getElementById('editorView'),
        usernameInput: document.getElementById('usernameInput'),
        passwordInput: document.getElementById('passwordInput'),
        loginBtn: document.getElementById('loginBtn'),
        accountLabel: document.getElementById('accountLabel'),
        newBtn: document.getElementById('newBtn'),
        sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
        pinnedNotes: document.getElementById('pinnedNotes'),
        tagList: document.getElementById('tagList'),
        refreshBtn: document.getElementById('refreshBtn'),
        storageStatus: document.getElementById('storageStatus'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        menuBtn: document.getElementById('menuBtn'),
        errorBanner: document.getElementById('errorBanner'),
        noteList: document.getElementById('noteList'),
        summaryText: document.getElementById('summaryText'),
        status: document.getElementById('status'),
        editorTitle: document.getElementById('editorTitle'),
        editorHint: document.getElementById('editorHint'),
        closeEditorBtn: document.getElementById('closeEditorBtn'),
        previewToggleBtn: document.getElementById('previewToggleBtn'),
        editorGrid: document.getElementById('editorGrid'),
        editorPreviewPanel: document.getElementById('editorPreviewPanel'),
        deleteNoteBtn: document.getElementById('deleteNoteBtn'),
        noteTitleInput: document.getElementById('noteTitleInput'),
        noteContentInput: document.getElementById('noteContentInput'),
        noteTagsInput: document.getElementById('noteTagsInput'),
        attachmentInput: document.getElementById('attachmentInput'),
        pickAttachmentBtn: document.getElementById('pickAttachmentBtn'),
        attachmentSection: document.getElementById('attachmentSection'),
        previewTitle: document.getElementById('previewTitle'),
        previewTags: document.getElementById('previewTags'),
        previewBody: document.getElementById('previewBody'),
        previewCount: document.getElementById('previewCount'),
        previewAttachments: document.getElementById('previewAttachments'),
        noteMenu: document.getElementById('noteMenu'),
        appMenu: document.getElementById('appMenu'),
      };

      function escapeHtml(text) {
        return String(text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function setTheme(theme) {
        state.theme = theme;
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('memonote:theme', theme);
      }

      function setSidebarCollapsed(collapsed) {
        state.sidebarCollapsed = Boolean(collapsed);
        localStorage.setItem('memonote:sidebarCollapsed', state.sidebarCollapsed ? '1' : '0');
        els.appShell.querySelector('.shell')?.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
        els.sidebarToggleBtn.textContent = state.sidebarCollapsed ? '›' : '‹';
        els.sidebarToggleBtn.setAttribute('aria-label', state.sidebarCollapsed ? '显示左侧栏' : '隐藏左侧栏');
      }

      function setEditorPreviewVisible(visible) {
        if (!els.editorGrid || !els.editorPreviewPanel || !els.previewToggleBtn) return;
        els.editorGrid.classList.toggle('preview-open', visible);
        els.editorPreviewPanel.classList.toggle('hidden', !visible);
        els.previewToggleBtn.textContent = visible ? '隐藏预览' : '预览';
        els.previewToggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      }

      function setActiveTag(tag) {
        state.activeTag = tag;
        localStorage.setItem('memonote:activeTag', tag);
        renderAll();
      }

      function setStatus(message) {
        clearTimeout(state.statusTimer);
        if (!message) {
          els.status.textContent = '';
          els.status.classList.remove('show');
          return;
        }
        els.status.textContent = message;
        els.status.classList.add('show');
        state.statusTimer = setTimeout(() => els.status.classList.remove('show'), 1800);
      }

      function formatDate(ts) {
        return new Intl.DateTimeFormat('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(ts));
      }

      function normalizeList(value) {
        return Array.isArray(value)
          ? value
          : String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
      }

      function renderHighlightedHtml(text, query) {
        const source = String(text || '');
        const needle = String(query || '').trim();
        if (!needle) return escapeHtml(source);

        const lowerSource = source.toLowerCase();
        const lowerNeedle = needle.toLowerCase();
        const needleLength = lowerNeedle.length;
        let index = 0;
        let output = '';

        while (true) {
          const matchIndex = lowerSource.indexOf(lowerNeedle, index);
          if (matchIndex === -1) break;
          output += escapeHtml(source.slice(index, matchIndex));
          output += '<mark class="search-mark">' + escapeHtml(source.slice(matchIndex, matchIndex + needleLength)) + '</mark>';
          index = matchIndex + needleLength;
        }

        output += escapeHtml(source.slice(index));
        return output;
      }

      function renderMarkdownInline(text) {
        const stash = [];
        let output = escapeHtml(String(text || ''));

        function hold(html) {
          stash.push(html);
          return '\u0000' + (stash.length - 1) + '\u0000';
        }

        output = output.replace(/\x60([^\x60]+)\x60/g, (_, code) => hold('<code>' + code + '</code>'));
        output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, href) => {
          return hold('<a href="' + escapeHtml(href) + '" target="_blank" rel="noreferrer">' + label + '</a>');
        });
        output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        output = output.replace(/__(.+?)__/g, '<strong>$1</strong>');
        output = output.replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
        output = output.replace(/(^|[^_])_(?!\s)([^_]+?)_(?!_)/g, '$1<em>$2</em>');

        return output.replace(/\u0000(\d+)\u0000/g, (_, index) => stash[Number(index)] || '');
      }

      function renderMarkdownHtml(text) {
        const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
        const codeFence = '\x60\x60\x60';
        const blocks = [];
        let paragraph = [];
        let listType = '';
        let codeLines = null;

        function flushParagraph() {
          if (!paragraph.length) return;
          blocks.push('<p>' + paragraph.map((line) => renderMarkdownInline(line)).join('<br />') + '</p>');
          paragraph = [];
        }

        function flushList() {
          if (!listType) return;
          blocks.push('</' + listType + '>');
          listType = '';
        }

        function flushCode() {
          if (codeLines === null) return;
          blocks.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
          codeLines = null;
        }

        for (const line of lines) {
          if (codeLines) {
            if (line.trim().startsWith(codeFence)) {
              flushCode();
            } else {
              codeLines.push(line);
            }
            continue;
          }

          const trimmed = line.trim();
          if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
          }

          if (trimmed.startsWith(codeFence)) {
            flushParagraph();
            flushList();
            codeLines = [];
            continue;
          }

          const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            blocks.push('<h' + level + '>' + renderMarkdownInline(headingMatch[2]) + '</h' + level + '>');
            continue;
          }

          const quoteMatch = trimmed.match(/^>\s?(.*)$/);
          if (quoteMatch) {
            flushParagraph();
            flushList();
            blocks.push('<blockquote><p>' + renderMarkdownInline(quoteMatch[1]) + '</p></blockquote>');
            continue;
          }

          const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
          if (unorderedMatch) {
            flushParagraph();
            if (listType !== 'ul') {
              flushList();
              blocks.push('<ul>');
              listType = 'ul';
            }
            blocks.push('<li>' + renderMarkdownInline(unorderedMatch[1]) + '</li>');
            continue;
          }

          const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
          if (orderedMatch) {
            flushParagraph();
            if (listType !== 'ol') {
              flushList();
              blocks.push('<ol>');
              listType = 'ol';
            }
            blocks.push('<li>' + renderMarkdownInline(orderedMatch[1]) + '</li>');
            continue;
          }

          flushList();
          paragraph.push(line);
        }

        flushParagraph();
        flushList();
        flushCode();

        return blocks.join('') || '<p>暂无正文。</p>';
      }

      function setError(message) {
        state.error = String(message || '');
        if (!state.error) {
          els.errorBanner.textContent = '';
          els.errorBanner.classList.remove('show');
          return;
        }
        els.errorBanner.textContent = state.error;
        els.errorBanner.classList.add('show');
      }

      function setLoading(loading, message = '') {
        state.loading = Boolean(loading);
        if (message) {
          setStatus(message);
        }
        renderAll();
      }

      function noteSearchText(note) {
        return [
          note.title,
          note.content,
          ...(note.tags || []),
          ...(note.attachments || []).map((item) => item.filename),
        ]
          .join(' ')
          .toLowerCase();
      }

      function filterNotes() {
        const query = state.query.trim().toLowerCase();
        state.filtered = state.notes.filter((note) => {
          if (state.activeTag !== 'all' && !(note.tags || []).some((tag) => tag.toLowerCase() === state.activeTag)) {
            return false;
          }
          if (!query) return true;
          return noteSearchText(note).includes(query);
        });
      }

      function collectTags(notes) {
        const map = new Map();
        for (const note of notes) {
          for (const tag of note.tags || []) {
            const key = tag.toLowerCase();
            map.set(key, { label: tag, count: (map.get(key)?.count || 0) + 1 });
          }
        }
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
      }

      function imgAttachments(note) {
        return (note.attachments || []).filter((item) => (item.content_type || '').startsWith('image/'));
      }

      function renderAttachmentChips(note, query = '') {
        const attachments = note.attachments || [];
        if (!attachments.length) return '';
        return attachments.map((attachment) => {
          const icon = (attachment.content_type || '').startsWith('image/')
            ? '🖼'
            : attachment.content_type === 'application/pdf'
              ? 'PDF'
              : '📎';
          const matched = String(query || '').trim() && attachment.filename.toLowerCase().includes(String(query || '').trim().toLowerCase());
          return '<a class="chip muted' + (matched ? ' search-hit' : '') + '" href="/api/attachments/' + attachment.id + '" target="_blank" rel="noreferrer">' + icon + ' ' + renderHighlightedHtml(attachment.filename, query) + '</a>';
        }).join('');
      }

      function renderAttachmentsPreview(note) {
        const attachments = note.attachments || [];
        if (!attachments.length) return '';
        const image = imgAttachments(note)[0];
        if (image) {
          return '<div class="attachment-thumb"><img src="/api/attachments/' + image.id + '" alt="' + escapeHtml(image.filename) + '" /></div>' +
            attachments
              .filter((item) => item.id !== image.id)
              .map((attachment) => '<a class="attachment-file" href="/api/attachments/' + attachment.id + '" target="_blank" rel="noreferrer"><div>📎</div><div><div>' + escapeHtml(attachment.filename) + '</div><small>' + escapeHtml(attachment.content_type) + '</small></div></a>')
              .join('');
        }
        return attachments
          .map((attachment) => '<a class="attachment-file" href="/api/attachments/' + attachment.id + '" target="_blank" rel="noreferrer"><div>📎</div><div><div>' + escapeHtml(attachment.filename) + '</div><small>' + escapeHtml(attachment.content_type) + '</small></div></a>')
          .join('');
      }

      function renderNoteCard(note, mode) {
        const query = state.query.trim();
        const card = document.createElement('article');
        card.className = 'note-card';
        if (query) card.classList.add('search-hit');
        card.dataset.id = note.id;
        const inner = document.createElement('div');
        inner.className = 'note-card-inner';

        const meta = document.createElement('div');
        meta.className = 'note-meta';
        meta.innerHTML =
          '<div class="note-meta-left"><span>' +
          formatDate(note.updated_at) +
          '</span><span>' +
          (note.content || '').replace(/\\s+/g, '').length +
          ' 字</span></div>' +
          '<button type="button" class="pin-btn' +
          (note.pinned_at ? ' active' : '') +
          '" aria-label="' +
          (note.pinned_at ? '取消置顶' : '置顶') +
          '" title="' +
          (note.pinned_at ? '取消置顶' : '置顶') +
          '" data-pin-button="1">📌</button>';
        const pinBtn = meta.querySelector('[data-pin-button="1"]');
        pinBtn?.addEventListener('click', (event) => {
          event.stopPropagation();
          togglePin(note.id).catch((error) => setStatus(error.message || '置顶失败'));
        });

        const title = document.createElement('h3');
        title.className = 'note-title';
        title.innerHTML = renderHighlightedHtml(note.title || '无标题', query);

        const preview = document.createElement('div');
        preview.className = 'note-preview';
        const previewText = (note.content || '').trim() ? (note.content || '').replace(/\\s+/g, ' ').slice(0, mode === 'gallery' ? 110 : 180) : '暂无内容。';
        preview.innerHTML = renderHighlightedHtml(previewText, query);

        const tags = document.createElement('div');
        tags.className = 'tag-row';
        tags.innerHTML = (note.tags || [])
          .map((tag) => {
            const matched = query && tag.toLowerCase().includes(query.toLowerCase());
            return '<span class="chip' + (matched ? ' search-hit' : '') + '">#' + renderHighlightedHtml(tag, query) + '</span>';
          })
          .join('');

        const attachmentRow = document.createElement('div');
        attachmentRow.className = 'attachment-row';
        attachmentRow.innerHTML = renderAttachmentChips(note, query);

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const openBtn = document.createElement('button');
        openBtn.className = 'btn secondary';
        openBtn.textContent = '编辑';
        openBtn.onclick = () => openEditor(note.id);

        actions.append(openBtn);
        inner.append(meta, title, preview, tags);
        if ((note.attachments || []).length) {
          const img = imgAttachments(note)[0];
          if (img) {
            const thumb = document.createElement('div');
            thumb.className = 'attachment-thumb';
            thumb.innerHTML = '<img src="/api/attachments/' + img.id + '" alt="' + escapeHtml(img.filename) + '" />';
            inner.append(thumb);
          }
          inner.append(attachmentRow);
        }
        inner.append(actions);
        card.append(inner);
        card.addEventListener('click', (event) => {
          if (event.target.closest('button,a,input')) return;
          openEditor(note.id);
        });
        card.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          openNoteMenu(note.id, event.clientX, event.clientY);
        });
        return card;
      }

      function renderPinnedNotes() {
        if (!els.pinnedNotes) return;
        const pinned = [...state.notes]
          .filter((note) => Boolean(note.pinned_at))
          .sort((a, b) => (b.pinned_at || 0) - (a.pinned_at || 0) || (b.updated_at || 0) - (a.updated_at || 0));
        if (!pinned.length) {
          els.pinnedNotes.innerHTML = '<div class="pinned-note-empty">还没有置顶笔记。</div>';
          return;
        }
        els.pinnedNotes.innerHTML = pinned.map((note) =>
          '<button type="button" class="pinned-note" data-note-id="' +
            note.id +
            '">' +
            '<div class="pinned-note-title">' +
            escapeHtml(note.title || '无标题') +
            '</div>' +
            '<div class="pinned-note-meta">' +
            formatDate(note.updated_at) +
            '</div>' +
          '</button>'
        ).join('');
        els.pinnedNotes.querySelectorAll('[data-note-id]').forEach((button) => {
          button.addEventListener('click', () => openEditor(button.getAttribute('data-note-id') || ''));
        });
      }

      function renderTags() {
        const tags = collectTags(state.notes);
        const items = [
          \`<button class="tag-item \${state.activeTag === 'all' ? 'active' : ''}" data-tag="all"><span>全部</span><span>\${state.notes.length}</span></button>\`,
          ...tags.map((tag) =>
            \`<button class="tag-item \${state.activeTag === tag.label.toLowerCase() ? 'active' : ''}" data-tag="\${escapeHtml(tag.label.toLowerCase())}"><span># \${escapeHtml(tag.label)}</span><span>\${tag.count}</span></button>\`
          ),
        ];
        els.tagList.innerHTML = items.join('');
        els.tagList.querySelectorAll('[data-tag]').forEach((button) => {
          button.addEventListener('click', () => setActiveTag(button.dataset.tag || 'all'));
        });
      }

      async function togglePin(noteId) {
        const response = await api('/api/notes/' + encodeURIComponent(noteId) + '/pin', { method: 'POST' });
        const index = state.notes.findIndex((item) => item.id === noteId);
        if (index >= 0) {
          state.notes[index] = response.note;
        }
        filterNotes();
        renderAll();
        if (state.editing?.note?.id === noteId) {
          state.editing.note = structuredClone(response.note);
          renderAttachmentSection();
          if (!els.editorPreviewPanel?.classList.contains('hidden')) previewEditor();
        }
        setStatus(response.note?.pinned_at ? '已置顶' : '已取消置顶');
      }

      function closeNoteMenu() {
        state.noteMenu = null;
        els.noteMenu.classList.remove('open');
        els.noteMenu.setAttribute('aria-hidden', 'true');
        els.noteMenu.innerHTML = '';
      }

      function closeAppMenu() {
        els.appMenu.classList.remove('open');
        els.appMenu.setAttribute('aria-hidden', 'true');
        els.appMenu.innerHTML = '';
      }

      function openNoteMenu(noteId, x, y) {
        const note = state.notes.find((item) => item.id === noteId);
        if (!note) return;
        state.noteMenu = { noteId };
        els.noteMenu.innerHTML = \`
          <button type="button" data-action="open">打开备忘录</button>
          <button type="button" data-action="copy">复制内容</button>
          <div class="note-menu-separator"></div>
          <button type="button" class="danger" data-action="delete">删除</button>
        \`;
        els.noteMenu.classList.add('open');
        els.noteMenu.setAttribute('aria-hidden', 'false');
        els.noteMenu.style.left = '0px';
        els.noteMenu.style.top = '0px';
        els.noteMenu.style.visibility = 'hidden';
        const width = els.noteMenu.offsetWidth;
        const height = els.noteMenu.offsetHeight;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);
        els.noteMenu.style.left = Math.min(x, maxX) + 'px';
        els.noteMenu.style.top = Math.min(y, maxY) + 'px';
        els.noteMenu.style.visibility = 'visible';
        const focusable = els.noteMenu.querySelector('button');
        focusable?.focus();
      }

      function openAppMenu(x, y) {
        els.appMenu.innerHTML = \`
          <div class="menu-label">主题切换</div>
          <button type="button" data-theme="light"\${state.theme === 'light' ? ' class="active"' : ''}>浅色</button>
          <button type="button" data-theme="warm"\${state.theme === 'warm' ? ' class="active"' : ''}>暖色</button>
          <button type="button" data-theme="dark"\${state.theme === 'dark' ? ' class="active"' : ''}>深色</button>
          <div class="note-menu-separator"></div>
          <button type="button" class="danger" data-action="logout">退出</button>
        \`;
        els.appMenu.classList.add('open');
        els.appMenu.setAttribute('aria-hidden', 'false');
        els.appMenu.style.left = '0px';
        els.appMenu.style.top = '0px';
        els.appMenu.style.visibility = 'hidden';
        const width = els.appMenu.offsetWidth;
        const height = els.appMenu.offsetHeight;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);
        els.appMenu.style.left = Math.min(x, maxX) + 'px';
        els.appMenu.style.top = Math.min(y, maxY) + 'px';
        els.appMenu.style.visibility = 'visible';
        const focusable = els.appMenu.querySelector('button');
        focusable?.focus();
      }

      function renderNotes() {
        renderPinnedNotes();
        renderTags();
        const query = state.query.trim();
        if (state.loading) {
          els.summaryText.textContent = '正在加载笔记...';
        } else if (query) {
          els.summaryText.textContent = '搜索“' + query + '”，找到 ' + state.filtered.length + ' 条结果。';
        } else {
          els.summaryText.textContent = '画廊视图，适合快速扫一眼内容。';
        }

        if (state.loading) {
          els.noteList.innerHTML =
            '<div class="loading-state">' +
              '<div class="loading-dots"><span></span><span></span><span></span></div>' +
              '<div>正在加载笔记…</div>' +
            '</div>';
          return;
        }

        if (!state.filtered.length) {
          els.noteList.innerHTML = query
            ? '<div class="empty">没有找到包含“' + escapeHtml(query) + '”的笔记。试试换个关键词，或者清空搜索。</div>'
            : '<div class="empty">现在还没有笔记。先点“新建”写一条吧。</div>';
          return;
        }

        els.noteList.innerHTML = '<div class="gallery-grid"></div>';
        const grid = els.noteList.querySelector('.gallery-grid');
        state.filtered.forEach((note) => grid.appendChild(renderNoteCard(note, 'gallery')));
      }

      function previewEditor() {
        const title = els.noteTitleInput.value.trim() || '未命名';
        const content = els.noteContentInput.value || '';
        const tags = normalizeList(els.noteTagsInput.value);
        els.previewTitle.textContent = title;
        els.previewCount.textContent = content.replace(/\\s+/g, '').length + ' 字';
        els.previewBody.innerHTML = renderMarkdownHtml(content);
        els.previewTags.innerHTML = tags.map((tag) => '<span class="chip">#' + escapeHtml(tag) + '</span>').join('');
        if (tags.length === 0) {
          els.previewTags.innerHTML = '<span class="chip muted">无标签</span>';
        }
        if (state.editing?.note) {
          els.previewAttachments.innerHTML = renderAttachmentsPreview(state.editing.note);
        } else {
          els.previewAttachments.innerHTML = '<span class="chip muted">保存后可上传附件</span>';
        }
      }

      function editorSignature() {
        if (!state.editing) return '';
        return JSON.stringify({
          id: state.editing.note?.id || null,
          title: els.noteTitleInput.value.trim(),
          content: els.noteContentInput.value,
          tags: normalizeList(els.noteTagsInput.value),
        });
      }

      function clearAutosaveTimer() {
        if (state.autosaveTimer) {
          clearTimeout(state.autosaveTimer);
          state.autosaveTimer = null;
        }
      }

      function scheduleAutosave() {
        if (!state.editing || els.editorView.classList.contains('hidden')) return;
        clearAutosaveTimer();
        state.autosaveTimer = setTimeout(() => {
          state.autosaveTimer = null;
          if (!state.editing || els.editorView.classList.contains('hidden')) return;
          const hasText = els.noteTitleInput.value.trim() || els.noteContentInput.value.trim();
          if (!state.editing.note?.id && !hasText) return;
          const signature = editorSignature();
          if (signature === state.lastSavedEditorSignature) return;
          saveEditor({ source: 'autosave' }).catch((error) => setStatus(error.message || '自动保存失败'));
        }, 900);
      }

      function renderAttachmentSection() {
        if (!state.editing?.note?.id) {
          els.attachmentSection.innerHTML = '<div class="field-help">先保存笔记，再上传图片、PDF 或 Office 文件。</div>';
          return;
        }
        const attachments = state.editing.note.attachments || [];
        if (!attachments.length) {
          els.attachmentSection.innerHTML = '<div class="field-help">当前还没有附件。</div>';
          return;
        }
        els.attachmentSection.innerHTML = attachments.map((attachment) => \`
          <div class="attachment-item">
            <div class="meta">
              <a href="/api/attachments/\${attachment.id}" target="_blank" rel="noreferrer">\${escapeHtml(attachment.filename)}</a>
              <small>\${escapeHtml(attachment.content_type)} · \${Math.max(1, Math.round(attachment.size / 1024))} KB</small>
            </div>
            <button class="btn secondary" data-delete-attachment="\${attachment.id}">删除</button>
          </div>
        \`).join('');
        els.attachmentSection.querySelectorAll('[data-delete-attachment]').forEach((button) => {
          button.addEventListener('click', async () => {
            const attachmentId = button.getAttribute('data-delete-attachment');
            if (!attachmentId) return;
            await api('/api/attachments/' + encodeURIComponent(attachmentId), { method: 'DELETE' });
            await loadNote(state.editing.note.id);
            setStatus('附件已删除');
          });
        });
      }

      function openEditor(noteId = null) {
        const note = noteId ? state.notes.find((item) => item.id === noteId) || null : null;
        state.editing = { note: note ? structuredClone(note) : { id: null, title: '', content: '', tags: [], attachments: [] }, isNew: !note };
        state.lastSavedEditorSignature = note
          ? JSON.stringify({
              id: note.id,
              title: (note.title || '').trim(),
              content: note.content || '',
              tags: normalizeList(note.tags || []),
            })
          : '';
        clearAutosaveTimer();
        els.editorTitle.textContent = note ? '编辑笔记' : '新建笔记';
        els.editorHint.textContent = note ? '修改内容、标签和附件，内容会自动保存。' : '内容会自动保存，保存后再添加附件。';
        els.noteTitleInput.value = note?.title || '';
        els.noteContentInput.value = note?.content || '';
        els.noteTagsInput.value = (note?.tags || []).join(', ');
        els.deleteNoteBtn.disabled = !note?.id;
        state.uploadQueue = [];
        els.attachmentInput.value = '';
        renderAttachmentSection();
        setEditorPreviewVisible(false);
        previewEditor();
        els.editorView.classList.remove('hidden');
        setTimeout(() => els.noteTitleInput.focus(), 0);
      }

      function closeEditor() {
        clearAutosaveTimer();
        setEditorPreviewVisible(false);
        els.editorView.classList.add('hidden');
        state.editing = null;
        state.lastSavedEditorSignature = '';
      }

      async function loadSession() {
        const session = await api('/api/session');
        state.session = session;
        els.accountLabel.textContent = session.username || 'admin';
      }

      async function loadHealth() {
        const health = await api('/api/health');
        els.storageStatus.textContent =
          '搜索会覆盖标题、正文、标签和附件文件名。当前附件存储：' +
          (health.attachmentStorage === 'r2' ? 'R2' : '本地内存');
      }

      async function loadNotes() {
        setLoading(true);
        try {
          const data = await api('/api/notes');
          state.notes = data.notes || [];
          filterNotes();
          renderAll();
        } finally {
          setLoading(false);
        }
      }

      async function loadNote(id) {
        const data = await api('/api/notes/' + encodeURIComponent(id));
        const index = state.notes.findIndex((item) => item.id === id);
        if (index >= 0) state.notes[index] = data.note;
        filterNotes();
        renderAll();
        if (state.editing?.note?.id === id) {
          state.editing.note = structuredClone(data.note);
          els.noteTitleInput.value = data.note.title || '';
          els.noteContentInput.value = data.note.content || '';
          els.noteTagsInput.value = (data.note.tags || []).join(', ');
          renderAttachmentSection();
          if (!els.editorPreviewPanel?.classList.contains('hidden')) previewEditor();
        }
      }

      async function saveEditor(options = {}) {
        const source = options.source || 'manual';
        if (!state.editing) return;
        clearAutosaveTimer();
        const payload = {
          title: els.noteTitleInput.value,
          content: els.noteContentInput.value,
          tags: normalizeList(els.noteTagsInput.value),
        };
        const method = state.editing.isNew ? 'POST' : 'PUT';
        const url = state.editing.isNew ? '/api/notes' : '/api/notes/' + encodeURIComponent(state.editing.note.id);
        const response = await api(url, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (state.editing.isNew) {
          state.editing.isNew = false;
          state.editing.note = response.note;
          els.deleteNoteBtn.disabled = false;
          await loadNotes();
          renderAttachmentSection();
          if (!els.editorPreviewPanel?.classList.contains('hidden')) previewEditor();
          setStatus(source === 'autosave' ? '已自动保存' : '已创建');
        } else {
          state.editing.note = response.note;
          await loadNotes();
          renderAttachmentSection();
          if (!els.editorPreviewPanel?.classList.contains('hidden')) previewEditor();
          setStatus(source === 'autosave' ? '已自动保存' : '已保存');
        }
        state.lastSavedEditorSignature = editorSignature();

        if (els.attachmentInput.files && els.attachmentInput.files.length) {
          const files = Array.from(els.attachmentInput.files);
          for (const file of files) {
            const form = new FormData();
            form.set('file', file);
            const uploaded = await api('/api/notes/' + encodeURIComponent(state.editing.note.id) + '/attachments', {
              method: 'POST',
              body: form,
            });
            state.editing.note.attachments = [...(state.editing.note.attachments || []), uploaded.attachment];
          }
          els.attachmentInput.value = '';
          await loadNote(state.editing.note.id);
          setStatus('附件已上传');
        }
      }

      async function removeNote(id) {
        if (!confirm('删除这条笔记并清除它的附件？')) return;
        await api('/api/notes/' + encodeURIComponent(id), { method: 'DELETE' });
        if (state.editing?.note?.id === id) closeEditor();
        await loadNotes();
        setStatus('已删除');
      }

      async function login() {
        const username = els.usernameInput.value.trim() || 'admin';
        const password = els.passwordInput.value;
        if (!password) {
          setStatus('请输入密码');
          return;
        }
        await api('/api/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        await boot();
      }

      async function logout() {
        await api('/api/logout', { method: 'POST' });
        state.session = null;
        state.notes = [];
        state.filtered = [];
        els.passwordInput.value = '';
        els.appShell.classList.add('hidden');
        els.loginView.classList.remove('hidden');
        setTimeout(() => els.passwordInput.focus(), 0);
        setStatus('');
      }

      async function api(url, options = {}) {
        try {
          const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, options));
          const data = await res.json().catch(() => ({}));
          if (res.status === 401) {
            setError('请先登录');
            els.appShell.classList.add('hidden');
            els.loginView.classList.remove('hidden');
            throw new Error('请先登录');
          }
          if (!res.ok) {
            setError(data.error || '请求失败');
            throw new Error(data.error || '请求失败');
          }
          setError('');
          return data;
        } catch (error) {
          if (!(error instanceof Error && error.message === '请先登录')) {
            setError(error instanceof Error ? error.message : '请求失败');
          }
          throw error;
        }
      }

      function renderAll() {
        const authed = Boolean(state.session && state.session.authenticated);
        els.appShell.classList.toggle('hidden', !authed);
        if (!authed) return;
        els.loginView.classList.add('hidden');
        els.appShell.querySelector('.shell')?.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
        els.sidebarToggleBtn.textContent = state.sidebarCollapsed ? '›' : '‹';
        els.sidebarToggleBtn.setAttribute('aria-label', state.sidebarCollapsed ? '显示左侧栏' : '隐藏左侧栏');
        els.errorBanner.classList.toggle('show', Boolean(state.error));
        els.errorBanner.textContent = state.error || '';
        renderNotes();
      }

      async function boot() {
        setTheme(state.theme);
        setLoading(true);
        try {
          const session = await api('/api/session');
          state.session = session.authenticated ? session : null;
          els.accountLabel.textContent = session.username || 'admin';
          if (!session.authenticated) {
            els.loginView.classList.remove('hidden');
            els.appShell.classList.add('hidden');
            return;
          }
          els.loginView.classList.add('hidden');
          els.appShell.classList.remove('hidden');
          await loadHealth();
          await loadNotes();
          renderAll();
        } finally {
          setLoading(false);
        }
      }

      els.loginBtn.addEventListener('click', () => login().catch((error) => setStatus(error.message || '登录失败')));
      els.passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') login().catch((error) => setStatus(error.message || '登录失败'));
      });
      els.newBtn.addEventListener('click', () => {
        setActiveTag('all');
        openEditor();
      });
      els.sidebarToggleBtn.addEventListener('click', () => {
        setSidebarCollapsed(!state.sidebarCollapsed);
        renderAll();
      });
      els.refreshBtn.addEventListener('click', () => loadNotes().then(() => setStatus('已刷新')).catch((error) => setStatus(error.message || '刷新失败')));
      els.searchInput.addEventListener('input', () => {
        state.query = els.searchInput.value;
        filterNotes();
        renderAll();
      });
      els.clearSearchBtn.addEventListener('click', () => {
        state.query = '';
        els.searchInput.value = '';
        filterNotes();
        renderAll();
      });
      els.closeEditorBtn.addEventListener('click', () => closeEditor());
      els.previewToggleBtn.addEventListener('click', () => {
        const visible = els.editorPreviewPanel?.classList.contains('hidden') ?? false;
        setEditorPreviewVisible(visible);
        if (visible) previewEditor();
      });
      els.deleteNoteBtn.addEventListener('click', () => {
        if (state.editing?.note?.id) {
          removeNote(state.editing.note.id).catch((error) => setStatus(error.message || '删除失败'));
        }
      });
      els.pickAttachmentBtn.addEventListener('click', () => els.attachmentInput.click());
      els.attachmentInput.addEventListener('change', () => {
        state.uploadQueue = Array.from(els.attachmentInput.files || []);
        setStatus(state.uploadQueue.length ? '已选择 ' + state.uploadQueue.length + ' 个附件' : '');
      });
      const onEditorInput = () => {
        if (!els.editorPreviewPanel?.classList.contains('hidden')) previewEditor();
        scheduleAutosave();
      };
      els.noteTitleInput.addEventListener('input', onEditorInput);
      els.noteContentInput.addEventListener('input', onEditorInput);
      els.noteTagsInput.addEventListener('input', onEditorInput);
      els.menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (els.appMenu.classList.contains('open')) {
          closeAppMenu();
          return;
        }
        const rect = els.menuBtn.getBoundingClientRect();
        openAppMenu(rect.left, rect.bottom + 8);
      });
      els.appMenu.addEventListener('click', async (event) => {
        const target = event.target instanceof HTMLElement ? event.target.closest('button') : null;
        if (!target) return;
        const theme = target.getAttribute('data-theme');
        const action = target.getAttribute('data-action');
        closeAppMenu();
        if (theme) {
          setTheme(theme);
          renderAll();
          return;
        }
        if (action === 'logout') {
          await logout();
        }
      });
      els.noteMenu.addEventListener('click', async (event) => {
        const action = (event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null);
        if (!action) return;
        const noteId = state.noteMenu?.noteId;
        if (!noteId) return;
        const note = state.notes.find((item) => item.id === noteId);
        if (!note) return;
        const command = action.getAttribute('data-action');
        closeNoteMenu();
        if (command === 'open') {
          openEditor(note.id);
          return;
        }
        if (command === 'copy') {
          await navigator.clipboard.writeText(note.content || '');
          setStatus('已复制到剪贴板');
          return;
        }
        if (command === 'delete') {
          await removeNote(note.id);
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !els.editorView.classList.contains('hidden')) closeEditor();
        if (event.key === 'Escape' && els.noteMenu.classList.contains('open')) closeNoteMenu();
        if (event.key === 'Escape' && els.appMenu.classList.contains('open')) closeAppMenu();
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
          event.preventDefault();
          openEditor();
        }
      });
      document.addEventListener('click', (event) => {
        if (!els.noteMenu.classList.contains('open')) return;
        if (event.target instanceof Node && els.noteMenu.contains(event.target)) return;
        closeNoteMenu();
      });
      document.addEventListener('click', (event) => {
        if (!els.appMenu.classList.contains('open')) return;
        if (event.target instanceof Node && (els.appMenu.contains(event.target) || els.menuBtn.contains(event.target))) return;
        closeAppMenu();
      });
      window.addEventListener('scroll', () => {
        if (els.noteMenu.classList.contains('open')) closeNoteMenu();
        if (els.appMenu.classList.contains('open')) closeAppMenu();
      }, true);
      window.addEventListener('resize', () => {
        if (els.noteMenu.classList.contains('open')) closeNoteMenu();
        if (els.appMenu.classList.contains('open')) closeAppMenu();
      });

      setTheme(state.theme);
      setSidebarCollapsed(state.sidebarCollapsed);
      boot().catch(() => {
        els.loginView.classList.remove('hidden');
        els.appShell.classList.add('hidden');
      });
    </script>
  </body>
</html>`;
