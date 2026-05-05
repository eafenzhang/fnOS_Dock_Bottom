const STORAGE_KEY = 'fnos_dock_bottom_enabled';
const toggleBtn = document.getElementById('toggleBtn');
const versionEl = document.getElementById('version');
const statusEl = document.getElementById('status');
const checkUpdateBtn = document.getElementById('checkUpdate');
const MANIFEST_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json';

chrome.storage.local.get([STORAGE_KEY], (result) => {
  if (result[STORAGE_KEY]) toggleBtn.classList.add('active');
});

async function showVersion() {
  versionEl.textContent = 'v?.? (加载中...)';
  try {
    const resp = await fetch(MANIFEST_URL + '?' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const manifest = await resp.json();
    versionEl.textContent = 'v' + manifest.version;
  } catch (e) {
    versionEl.textContent = 'v' + chrome.runtime.getManifest().version + ' (离线)';
  }
}
showVersion();

toggleBtn.addEventListener('click', () => {
  const isActive = toggleBtn.classList.toggle('active');
  chrome.storage.local.set({ [STORAGE_KEY]: isActive });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle', enabled: isActive }).catch(() => {});
    }
  });
});

checkUpdateBtn.addEventListener('click', async () => {
  statusEl.textContent = '检查中...';
  checkUpdateBtn.disabled = true;
  try {
    const resp = await fetch(MANIFEST_URL + '?' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const manifest = await resp.json();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'checkUpdate' }).catch(() => {});
      }
    });
    statusEl.textContent = manifest.version === chrome.runtime.getManifest().version ? '已是最新' : '发现新版本';
    versionEl.textContent = 'v' + manifest.version;
  } catch (e) {
    statusEl.textContent = '检查失败';
  }
  setTimeout(() => { statusEl.textContent = ''; checkUpdateBtn.disabled = false; }, 3000);
});
