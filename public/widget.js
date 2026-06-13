// Prime Health Booking Widget v2
// How it works:
// 1. This script creates a floating button on the host site
// 2. When clicked, it expands an iframe that loads the full widget from your domain
// 3. All API calls happen inside the iframe on your domain - no CORS issues
// 4. The iframe communicates with this script via postMessage

(function () {
  if (window.__PH_WIDGET_INIT__) return;
  window.__PH_WIDGET_INIT__ = true;

  // Read config from script tag attributes
  var scripts = document.getElementsByTagName('script');
  var thisScript = scripts[scripts.length - 1];
  var clinicId = thisScript.getAttribute('data-clinic-id');
  var baseUrl = thisScript.src.split('/widget.js')[0];

  if (!clinicId) {
    console.error('[Prime Health Widget] Missing data-clinic-id attribute on script tag.');
    return;
  }

  // ── Inject styles ──────────────────────────────────────────────────────────
  var css = document.createElement('style');
  css.textContent = '\
.ph-wrap{position:fixed;bottom:24px;right:24px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:16px;}\
.ph-btn{width:60px;height:60px;border-radius:50%;background:#8B5CF6;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);transition:transform 0.2s,box-shadow 0.2s;padding:0;flex-shrink:0;}\
.ph-btn:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(0,0,0,0.22);}\
.ph-btn:active{transform:scale(0.94);}\
.ph-btn svg{width:26px;height:26px;color:#fff;}\
.ph-badge{position:absolute;top:-2px;right:-2px;width:20px;height:20px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;}\
.ph-frame-wrap{width:420px;height:700px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.16);opacity:0;pointer-events:none;transform:translateY(16px) scale(0.96);transform-origin:bottom right;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);}\
.ph-frame-wrap.open{opacity:1;pointer-events:all;transform:translateY(0) scale(1);}\
.ph-frame{width:100%;height:100%;border:none;display:block;border-radius:20px;}\
@media(max-width:600px){\
.ph-wrap{bottom:16px;right:16px;}\
.ph-frame-wrap{position:fixed;inset:0;width:100%;height:100%;border-radius:0;}\
}';
  document.head.appendChild(css);

  // ── Build DOM ──────────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.className = 'ph-wrap';

  var frameWrap = document.createElement('div');
  frameWrap.className = 'ph-frame-wrap';

  var iframe = document.createElement('iframe');
  iframe.className = 'ph-frame';
  iframe.src = baseUrl + '/widget?clinicId=' + encodeURIComponent(clinicId) + '&embedded=1';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('loading', 'lazy');
  frameWrap.appendChild(iframe);

  var btnWrap = document.createElement('div');
  btnWrap.style.position = 'relative';

  var btn = document.createElement('button');
  btn.className = 'ph-btn';
  btn.setAttribute('aria-label', 'Open booking assistant');

  var badge = document.createElement('div');
  badge.className = 'ph-badge';
  badge.textContent = '1';

  var iconChat = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var iconClose = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  btn.innerHTML = iconChat;
  btnWrap.appendChild(btn);
  btnWrap.appendChild(badge);

  wrap.appendChild(frameWrap);
  wrap.appendChild(btnWrap);
  document.body.appendChild(wrap);

  // ── State & toggle ─────────────────────────────────────────────────────────
  var isOpen = false;

  function open() {
    isOpen = true;
    frameWrap.classList.add('open');
    badge.style.display = 'none';
    btn.innerHTML = iconClose;
    btn.setAttribute('aria-label', 'Close booking assistant');
  }

  function close() {
    isOpen = false;
    frameWrap.classList.remove('open');
    btn.innerHTML = iconChat;
    btn.setAttribute('aria-label', 'Open booking assistant');
  }

  btn.addEventListener('click', function () {
    if (isOpen) close(); else open();
  });

  // ── Listen for close message from iframe ───────────────────────────────────
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'PH_WIDGET_CLOSE') {
      close();
    }
  });

  // ── Fetch theme color and apply to button ──────────────────────────────────
  fetch(baseUrl + '/api/widget/clinic?clinicId=' + encodeURIComponent(clinicId))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.widget_theme_color) {
        btn.style.backgroundColor = data.widget_theme_color;
      }
    })
    .catch(function () {});
})();
