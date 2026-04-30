const STORAGE_KEY = 'fnos_dock_bottom_enabled';
const toggleBtn = document.getElementById('toggleBtn');
const debugEl = document.getElementById('debug');

function log(msg) {
  debugEl.textContent = msg;
  console.log('[Popup]', msg);
}

// 加载初始状态
chrome.storage.local.get([STORAGE_KEY], (result) => {
  log('Storage loaded: ' + JSON.stringify(result));
  if (result[STORAGE_KEY]) {
    toggleBtn.classList.add('active');
  }
});

// 点击切换
toggleBtn.addEventListener('click', () => {
  log('Toggle clicked');
  const isActive = toggleBtn.classList.toggle('active');
  chrome.storage.local.set({ [STORAGE_KEY]: isActive }, () => {
    log('Storage saved: ' + isActive);
  });

  // 通知 content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      log('Sending to tab: ' + tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggle',
        enabled: isActive
      }, (response) => {
        log('Response: ' + JSON.stringify(response));
      });
    } else {
      log('No active tab found');
    }
  });
});
