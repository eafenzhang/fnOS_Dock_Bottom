const STORAGE_KEY = 'fnos_dock_bottom_enabled';
const toggleBtn = document.getElementById('toggleBtn');
const versionEl = document.getElementById('version');
const statusEl = document.getElementById('status');
const checkUpdateBtn = document.getElementById('checkUpdate');
const MANIFEST_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json';

// 加载初始状态
chrome.storage.local.get([STORAGE_KEY], (result) => {
  if (result[STORAGE_KEY]) {
    toggleBtn.classList.add('active');
  }
});

// 显示版本（优先显示 GitHub 版本）
async function showVersion() {
  try {
    const resp = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
    const manifest = await resp.json();
    versionEl.textContent = 'v' + manifest.version;
  } catch (e) {
    // 获取失败显示本地版本
    const localManifest = chrome.runtime.getManifest();
    versionEl.textContent = 'v' + localManifest.version;
  }
}
showVersion();

// 点击切换
toggleBtn.addEventListener('click', () => {
  const isActive = toggleBtn.classList.toggle('active');
  chrome.storage.local.set({ [STORAGE_KEY]: isActive });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggle',
        enabled: isActive
      }).catch((err) => {
        console.log('[Popup] Cannot send to content script:', err.message);
      });
    }
  });
});

// 检查更新按钮 - 重新加载 CSS
checkUpdateBtn.addEventListener('click', async () => {
  statusEl.textContent = '加载中...';
  checkUpdateBtn.disabled = true;

  try {
    // 获取最新版本
    const resp = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
    const manifest = await resp.json();

    // 通知当前 tab 重新加载 CSS
    const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
    if (tabs[0] && tabs[0].id) {
      await new Promise(resolve => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'checkUpdate' }, resolve);
      });
    }

    statusEl.textContent = '已更新 v' + manifest.version;
    versionEl.textContent = 'v' + manifest.version;
  } catch (e) {
    statusEl.textContent = '更新失败';
    console.error(e);
  }

  setTimeout(() => {
    statusEl.textContent = '';
    checkUpdateBtn.disabled = false;
  }, 2000);
});
