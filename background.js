// Background Service Worker for auto-update
const VERSION_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json';
const REPO_URL = 'https://github.com/eafenzhang/fnOS_Dock_Bottom';
const CHECK_INTERVAL = 60 * 60 * 1000; // 1小时检查一次
const UPDATE_NOTIFY_KEY = 'update_notified_version';

chrome.runtime.onInstalled.addListener(() => {
  // 安装时检查一次
  checkForUpdate(true);
});

// 定期检查更新
chrome.alarms.create('checkUpdate', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkUpdate') {
    checkForUpdate(false);
  }
});

// 检查更新
async function checkForUpdate(isInstall) {
  try {
    const response = await fetch(VERSION_URL + '?t=' + Date.now(), {
      cache: 'no-store'
    });
    if (!response.ok) return;

    const remoteManifest = await response.json();
    const remoteVersion = remoteManifest.version;
    const currentVersion = chrome.runtime.getManifest().version;

    if (compareVersions(remoteVersion, currentVersion) > 0) {
      // 有新版本
      const lastNotified = await getLastNotifiedVersion();
      if (lastNotified !== remoteVersion || isInstall) {
        await setLastNotifiedVersion(remoteVersion);
        showUpdateNotification(remoteVersion, isInstall);
      }
    }
  } catch (e) {
    console.error('[AutoUpdate] Check failed:', e);
  }
}

// 版本比较：>0 表示 v1 更新，<0 表示 v2 更新，=0 表示相同
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// 获取上次通知的版本
function getLastNotifiedVersion() {
  return new Promise((resolve) => {
    chrome.storage.local.get([UPDATE_NOTIFY_KEY], (result) => {
      resolve(result[UPDATE_NOTIFY_KEY] || '');
    });
  });
}

// 设置上次通知的版本
function setLastNotifiedVersion(version) {
  chrome.storage.local.set({ [UPDATE_NOTIFY_KEY]: version });
}

// 显示更新提示
function showUpdateNotification(newVersion, isInstall) {
  const title = isInstall ? 'fnOS Dock Bottom 已安装' : 'fnOS Dock Bottom 发现新版本';
  const body = isInstall
    ? `当前版本 v${chrome.runtime.getManifest().version}，点击查看最新版本`
    : `发现新版本 v${newVersion}，点击下载更新`;

  chrome.notifications.create('update', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: body,
    priority: 1,
    buttons: [{ title: '查看更新' }]
  }, (id) => {
    // 存储通知ID
    chrome.storage.local.set({ updateNotificationId: id });
  });
}

// 点击通知按钮
chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  if (notifId === 'update' && btnIndex === 0) {
    chrome.tabs.create({ url: REPO_URL });
  }
});

// 点击通知本身
chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === 'update') {
    chrome.tabs.create({ url: REPO_URL });
  }
});

// 处理 popup 请求获取更新信息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkUpdate') {
    checkForUpdate(false).then(() => {
      sendResponse({ done: true });
    });
    return true;
  }
  if (message.action === 'getVersion') {
    const manifest = chrome.runtime.getManifest();
    sendResponse({
      currentVersion: manifest.version,
      repoUrl: REPO_URL
    });
    return true;
  }
});
