// Background Service Worker for fnOS Dock Bottom
const VERSION_URL = 'https://raw.githubusercontent.com/eafenzhang/fnOS_Dock_Bottom/main/manifest.json';
const REPO_URL = 'https://github.com/eafenzhang/fnOS_Dock_Bottom';
const UPDATE_NOTIFY_KEY = 'update_notified_version';

// 检查更新
async function checkForUpdate(isInstall = false) {
  try {
    console.log('[AutoUpdate] 检查更新中...');
    const response = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) {
      console.log('[AutoUpdate] 获取版本失败:', response.status);
      return;
    }
    const remoteManifest = await response.json();
    const remoteVersion = remoteManifest.version;
    const currentVersion = chrome.runtime.getManifest().version;
    console.log('[AutoUpdate] 远程版本:', remoteVersion, '当前版本:', currentVersion);
    if (compareVersions(remoteVersion, currentVersion) > 0) {
      console.log('[AutoUpdate] 发现新版本!');
      const lastNotified = await getLastNotifiedVersion();
      if (lastNotified !== remoteVersion || isInstall) {
        await setLastNotifiedVersion(remoteVersion);
        showUpdateNotification(remoteVersion, isInstall);
      }
    }
  } catch (e) {
    console.error('[AutoUpdate] 检查失败:', e);
  }
}

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

function getLastNotifiedVersion() {
  return new Promise((resolve) => {
    chrome.storage.local.get([UPDATE_NOTIFY_KEY], (result) => resolve(result[UPDATE_NOTIFY_KEY] || ''));
  });
}

function setLastNotifiedVersion(version) {
  chrome.storage.local.set({ [UPDATE_NOTIFY_KEY]: version });
}

function showUpdateNotification(newVersion, isInstall) {
  const title = isInstall ? 'fnOS Dock Bottom 已安装' : 'fnOS Dock Bottom 发现新版本';
  const body = isInstall
    ? `当前版本 v${chrome.runtime.getManifest().version}，点击查看最新版本`
    : `发现新版本 v${newVersion}，点击下载更新`;
  try {
    chrome.notifications.create('update', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: body,
      priority: 1,
      buttons: [{ title: '查看更新' }]
    });
  } catch (e) {
    console.error('[AutoUpdate] 通知失败:', e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoUpdate] 扩展已安装');
  checkForUpdate(true);
});

try {
  if (chrome.alarms) {
    chrome.alarms.create('checkUpdate', { periodInMinutes: 60 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'checkUpdate') checkForUpdate(false);
    });
  }
} catch (e) {
  console.log('[AutoUpdate] 无法创建定时器:', e);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkUpdate') {
    checkForUpdate(false).then(() => sendResponse({ done: true }));
    return true;
  }
  if (message.action === 'getVersion') {
    const manifest = chrome.runtime.getManifest();
    sendResponse({ currentVersion: manifest.version, repoUrl: REPO_URL });
    return true;
  }
  return true;
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIndex) => {
  if (notifId === 'update' && btnIndex === 0) chrome.tabs.create({ url: REPO_URL });
});

chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === 'update') chrome.tabs.create({ url: REPO_URL });
});

setTimeout(() => checkForUpdate(true), 3000);
