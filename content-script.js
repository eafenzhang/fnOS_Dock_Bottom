// fnOS Dock Bottom - Content Script
// 启用后从 GitHub 加载 CSS，点击检查更新重新加载 CSS

(function() {
  if (window.top !== window) return;

  const DOCK_CLASS = 'fnos-dock-bottom';
  const STORAGE_KEY = 'fnos_dock_bottom_enabled';
  const CSS_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/dock.css?' + Date.now();
  const MANIFEST_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json?' + Date.now();

  // 强制禁用缓存
  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // 从 GitHub 加载 CSS
  async function loadCssFromGitHub() {
    console.log('[Dock Bottom] 正在从 GitHub 加载 CSS...');
    try {
      const response = await fetch(CSS_URL, { headers: noCacheHeaders });
      if (!response.ok) {
        console.error('[Dock Bottom] CSS 响应失败:', response.status);
        return null;
      }
      const css = await response.text();

      // 移除旧样式
      const oldStyle = document.getElementById('fnos-dock-bottom-css');
      if (oldStyle) {
        oldStyle.remove();
        console.log('[Dock Bottom] 已移除旧样式');
      }

      // 注入新样式
      const style = document.createElement('style');
      style.id = 'fnos-dock-bottom-css';
      style.textContent = css;
      document.head.appendChild(style);
      console.log('[Dock Bottom] CSS 加载成功，长度:', css.length, '字符');
      return css;
    } catch (e) {
      console.error('[Dock Bottom] CSS 加载失败:', e.message);
      return null;
    }
  }

  // 应用/移除 Dock 底部样式
  function applyDockBottom(enabled) {
    if (!document.documentElement) return;

    if (enabled) {
      document.documentElement.classList.add(DOCK_CLASS);
      console.log('[Dock Bottom] 已启用 Dock 底部样式');
      loadCssFromGitHub();
    } else {
      document.documentElement.classList.remove(DOCK_CLASS);
      const oldStyle = document.getElementById('fnos-dock-bottom-css');
      if (oldStyle) oldStyle.remove();
      console.log('[Dock Bottom] 已禁用 Dock 底部样式');
    }
  }

  // 初始化
  function init() {
    console.log('[Dock Bottom] Content Script 初始化, 扩展版本:', chrome.runtime.getManifest().version);

    // 检查存储的状态
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY] === true) {
        console.log('[Dock Bottom] 检测到启用状态，应用样式...');
        applyDockBottom(true);
      } else {
        console.log('[Dock Bottom] 未启用，不应用样式');
      }
    });

    // 监听 storage 变化
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]) {
        console.log('[Dock Bottom] Storage 变化:', changes[STORAGE_KEY].newValue);
        applyDockBottom(changes[STORAGE_KEY].newValue);
      }
    });

    // 监听 popup 消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Dock Bottom] 收到消息:', message.action);
      if (message && message.action === 'toggle') {
        applyDockBottom(message.enabled);
        chrome.storage.local.set({ [STORAGE_KEY]: message.enabled });
        sendResponse({ success: true });
      }
      if (message && message.action === 'checkUpdate') {
        loadCssFromGitHub().then(css => {
          sendResponse({ success: !!css });
        });
        return true;
      }
      return true;
    });
  }

  // DOM 准备好后再初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
