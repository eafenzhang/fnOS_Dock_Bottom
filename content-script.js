// fnOS Dock Bottom - Content Script

(function() {
  if (window.top !== window) return;

  const DOCK_CLASS = 'fnos-dock-bottom';
  const STORAGE_KEY = 'fnos_dock_bottom_enabled';
  const CSS_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/dock.css';
  const DEBUG_MODE = true;

  const CRITICAL_SELECTORS = [
    '.fixed.inset-y-0.left-0',
    '.box-border.flex.h-full.flex-col.py-3',
    '.flex.flex-col.items-center.border-0'
  ];

  function log(...args) {
    if (DEBUG_MODE) console.log('[Dock Bottom]', ...args);
  }

  const FALLBACK_CSS = `
html.fnos-dock-bottom body .fixed.inset-y-0.left-0 {
  left: unset !important; top: unset !important; right: unset !important;
  bottom: 0 !important; width: auto !important; height: 80px !important;
  margin: 0 auto !important; display: flex !important;
  justify-content: center !important; align-items: center !important;
}
html.fnos-dock-bottom body .box-border.flex.h-full.flex-col.py-3 {
  flex-direction: row !important; align-items: center !important;
  justify-content: center !important; height: 100% !important; width: auto !important;
  max-width: 100% !important; padding: 0 16px !important; gap: 12px !important;
}
html.fnos-dock-bottom body .flex.flex-col.items-center.border-0 {
  flex-direction: row !important; border-right: 1px solid rgba(255,255,255,0.2) !important;
  border-bottom: none !important; padding-right: 8px !important;
  height: 100% !important; width: auto !important; align-items: center !important;
}
html.fnos-dock-bottom body .relative.flex.flex-1.flex-col {
  flex-direction: row !important; flex: unset !important; width: auto !important;
  height: 100% !important; align-items: center !important;
}
html.fnos-dock-bottom body .scrollbar-hidden.absolute.inset-0 {
  flex-direction: row !important; position: relative !important; inset: auto !important;
  overflow-y: hidden !important; overflow-x: auto !important;
  align-items: center !important; justify-content: flex-start !important;
  padding: 0 !important; height: 100% !important; width: auto !important;
}
html.fnos-dock-bottom body .flex.flex-col.items-center.justify-between.gap-5.pt-2 {
  flex-direction: row !important; justify-content: center !important;
  align-items: center !important; padding-top: 0 !important; width: auto !important;
  height: 100% !important; gap: 12px !important;
}
html.fnos-dock-bottom body .fixed.inset-y-0.left-0 [class*="h-"][class*="w-"] {
  display: flex !important; align-items: center !important; justify-content: center !important;
}`;

  function injectCss(css, source) {
    const oldStyle = document.getElementById('fnos-dock-bottom-css');
    if (oldStyle) { if (oldStyle.textContent === css) { log(source + ': same, skip'); return false; } oldStyle.remove(); }
    const style = document.createElement('style');
    style.id = 'fnos-dock-bottom-css';
    style.textContent = css;
    document.head.appendChild(style);
    log(source + ': injected');
    return true;
  }

  async function loadCssFromGitHub() {
    log('Loading from GitHub...');
    try {
      const response = await fetch(CSS_URL + '?' + Date.now(), { cache: 'no-store' });
      if (!response.ok) { log('GitHub failed:', response.status); return false; }
      const css = await response.text();
      if (css && css.length > 100) { injectCss(css, 'GitHub'); return true; }
    } catch (e) { log('GitHub error:', e.message); }
    return false;
  }

  function checkDockElements() {
    const found = [], missing = [];
    for (const sel of CRITICAL_SELECTORS) {
      try { document.querySelector(sel) ? found.push(sel) : missing.push(sel); } catch (e) { missing.push(sel); }
    }
    return { found, missing };
  }

  function applyDockBottom(enabled) {
    if (!document.documentElement) return;
    if (enabled) {
      document.documentElement.classList.add(DOCK_CLASS);
      log('Enabled, class added');
      injectCss(FALLBACK_CSS, 'Fallback');
      loadCssFromGitHub();
    } else {
      document.documentElement.classList.remove(DOCK_CLASS);
      const old = document.getElementById('fnos-dock-bottom-css');
      if (old) old.remove();
      log('Disabled');
    }
  }

  function init() {
    log('Init, version:', chrome.runtime.getManifest().version);
    log('Page:', window.location.href);
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY] === true) { log('Enabled in storage'); applyDockBottom(true); }
      else { log('Not enabled'); }
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]) applyDockBottom(changes[STORAGE_KEY].newValue);
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'toggle') {
        applyDockBottom(message.enabled);
        chrome.storage.local.set({ [STORAGE_KEY]: message.enabled });
        sendResponse({ success: true });
        return true;
      }
      if (message && message.action === 'getStatus') {
        const { found, missing } = checkDockElements();
        sendResponse({ enabled: document.documentElement.classList.contains(DOCK_CLASS), hasStyle: !!document.getElementById('fnos-dock-bottom-css'), foundCount: found.length, pageUrl: window.location.href });
        return true;
      }
      return true;
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
