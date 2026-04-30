const STORAGE_KEY = 'fnos_dock_bottom_enabled';
const toggleBtn = document.getElementById('toggleBtn');
const versionEl = document.getElementById('version');
const statusEl = document.getElementById('status');
const checkUpdateBtn = document.getElementById('checkUpdate');

// 显示当前版本
chrome.runtime.sendMessage({ action: 'getVersion' }, (info) => {
  if (info) {
    versionEl.textContent = 'v' + info.currentVersion;
  }
});

// 加载初始状态
chrome.storage.local.get([STORAGE_KEY], (result) => {
  if (result[STORAGE_KEY]) {
    toggleBtn.classList.add('active');
  }
});

// 点击切换
toggleBtn.addEventListener('click', () => {
  const isActive = toggleBtn.classList.toggle('active');
  chrome.storage.local.set({ [STORAGE_KEY]: isActive });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggle',
        enabled: isActive
      });
    }
  });
});

// 检查更新按钮
checkUpdateBtn.addEventListener('click', () => {
  statusEl.textContent = '检查中...';
  checkUpdateBtn.disabled = true;

  chrome.runtime.sendMessage({ action: 'checkUpdate' }, () => {
    setTimeout(() => {
      statusEl.textContent = '';
      checkUpdateBtn.disabled = false;
    }, 2000);
  });
});
