// fnOS Dock Bottom - Content Script
// 将 fnOS Dock 栏从左侧移到底部

(function() {
  if (window.top !== window) return;

  const DOCK_CLASS = 'fnos-dock-bottom';
  const STORAGE_KEY = 'fnos_dock_bottom_enabled';

  // 应用/移除 Dock 底部样式
  function applyDockBottom(enabled) {
    if (!document.documentElement) return;
    if (enabled) {
      document.documentElement.classList.add(DOCK_CLASS);
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

  // DOM 准备好后再初始化（确保 document.documentElement 可用）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
