// fnOS Dock Bottom - Content Script
// 每次运行时从 GitHub 加载最新 CSS，实现自动更新

(function() {
  if (window.top !== window) return;

  const DOCK_CLASS = 'fnos-dock-bottom';
  const STORAGE_KEY = 'fnos_dock_bottom_enabled';
  const CSS_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/dock.css';

  let cssLoaded = false;

  // 从 GitHub 加载最新 CSS
  async function loadCssFromGitHub() {
    try {
      const response = await fetch(CSS_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return false;
      const css = await response.text();

      // 移除旧样式
      const oldStyle = document.getElementById('fnos-dock-bottom-css');
      if (oldStyle) oldStyle.remove();

      // 注入新样式
      const style = document.createElement('style');
      style.id = 'fnos-dock-bottom-css';
      style.textContent = css;
      document.head.appendChild(style);
      cssLoaded = true;
      console.log('[fnOS Dock Bottom] CSS loaded from GitHub');
      return true;
    } catch (e) {
      console.error('[fnOS Dock Bottom] Failed to load CSS:', e);
      return false;
    }
  }

  // 应用/移除 Dock 底部样式
  function applyDockBottom(enabled) {
    if (!document.documentElement) return;

    if (enabled) {
      document.documentElement.classList.add(DOCK_CLASS);
      if (!cssLoaded) {
        loadCssFromGitHub(); // 首次启用时加载 CSS
      }
    } else {
      document.documentElement.classList.remove(DOCK_CLASS);
    }
  }

  // 初始化
  function init() {
    // 检查存储的状态
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY] === true) {
        applyDockBottom(true);
      }
    });

    // 监听 storage 变化
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]) {
        applyDockBottom(changes[STORAGE_KEY].newValue);
      }
    });

    // 监听 popup 消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'toggle') {
        applyDockBottom(message.enabled);
        chrome.storage.local.set({ [STORAGE_KEY]: message.enabled });
        sendResponse({ success: true });
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
