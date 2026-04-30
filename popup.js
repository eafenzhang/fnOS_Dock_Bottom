const STORAGE_KEY = 'fnos_dock_bottom_enabled';
const toggleBtn = document.getElementById('toggleBtn');
const versionEl = document.getElementById('version');
const statusEl = document.getElementById('status');
const checkUpdateBtn = document.getElementById('checkUpdate');
const MANIFEST_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json?' + Date.now();
const CSS_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/dock.css?' + Date.now();

// 强制禁用缓存
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// 加载初始状态
chrome.storage.local.get([STORAGE_KEY], (result) => {
  if (result[STORAGE_KEY]) {
    toggleBtn.classList.add('active');
  }
});

// 显示版本（从 GitHub 获取，失败则显示本地）
async function showVersion() {
  versionEl.textContent = 'v?.? (加载中...)';
  try {
    const resp = await fetch(MANIFEST_URL, { headers: noCacheHeaders });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const manifest = await resp.json();
    versionEl.textContent = 'v' + manifest.version;
    console.log('[Dock Bottom] GitHub 版本:', manifest.version, '| 本地版本:', chrome.runtime.getManifest().version);
  } catch (e) {
    const local = chrome.runtime.getManifest().version;
    versionEl.textContent = 'v' + local + ' (离线)';
    console.error('[Dock Bottom] 获取 GitHub 版本失败:', e.message);
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
        console.log('[Popup] 无法发送到 content script:', err.message);
      });
    }
  });
});

// 检查更新按钮
checkUpdateBtn.addEventListener('click', async () => {
  statusEl.textContent = '加载中...';
  checkUpdateBtn.disabled = true;

  try {
    // 获取最新版本
    const url = MANIFEST_URL + '&t=' + Date.now();
    const resp = await fetch(url, { headers: noCacheHeaders });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const manifest = await resp.json();

    // 通知当前 tab 重新加载 CSS
    const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
    if (tabs[0] && tabs[0].id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, { action: 'checkUpdate' });
      } catch (e) {
        console.log('[Popup] content script 未响应:', e.message);
      }
    }

    statusEl.textContent = '已是最新 v' + manifest.version;
    versionEl.textContent = 'v' + manifest.version;
    console.log('[Dock Bottom] 更新成功! GitHub v' + manifest.version + ' | 本地 v' + chrome.runtime.getManifest().version);
  } catch (e) {
    statusEl.textContent = '更新失败: ' + e.message;
    console.error('[Dock Bottom] 更新失败:', e);
  }

  setTimeout(() => {
    statusEl.textContent = '';
    checkUpdateBtn.disabled = false;
  }, 3000);
});
