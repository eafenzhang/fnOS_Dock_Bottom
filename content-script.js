// fnOS Dock Bottom - Content Script
// 将 fnOS Dock 栏从左侧移到底部

(function() {
  if (window.top !== window) return;

  const DOCK_CLASS = 'fnos-dock-bottom';
  const STORAGE_KEY = 'fnos_dock_bottom_enabled';

  // 检查存储的状态
  function loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] === true);
      });
    });
  }

  // 保存状态
  function saveState(enabled) {
    chrome.storage.local.set({ [STORAGE_KEY]: enabled });
  }

  // 应用/移除 Dock 底部样式
  function applyDockBottom(enabled) {
    if (enabled) {
      document.documentElement.classList.add(DOCK_CLASS);
    } else {
      document.documentElement.classList.remove(DOCK_CLASS);
    }
  }

  // 初始化
  async function init() {
    const enabled = await loadState();
    applyDockBottom(enabled);

    // 监听存储变化（支持 popup 控制）
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY]) {
        applyDockBottom(changes[STORAGE_KEY].newValue);
      }
    });
  }

  // 在 DOMContentLoaded 时确保类名已应用
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
