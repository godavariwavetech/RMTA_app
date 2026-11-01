import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

export const FCM_TOKEN_KEY = 'rmta_fcm_token';
export const NOTIF_HISTORY_KEY = 'rmta_notification_history';
const NOTIF_HISTORY_MAX = 60;

// ---- Notification history, shown on the Notifications screen -----------------------------
// Every push the app handles is also saved here (newest first, last 60), so the screen
// lists what was received even after the system notification is dismissed.
export async function getNotificationHistory() {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

async function saveNotificationHistory(list) {
  try {
    await AsyncStorage.setItem(NOTIF_HISTORY_KEY, JSON.stringify(list.slice(0, NOTIF_HISTORY_MAX)));
  } catch (e) {
    // best effort
  }
}

export async function recordNotification(message) {
  const data = message?.data || {};
  const title = message?.notification?.title || data.title || '';
  const body = message?.notification?.body || data.body || '';
  if (!title && !body) return;
  const id = String(message?.messageId || `${Date.now()}`);
  const list = await getNotificationHistory();
  if (list.some(n => n.id === id)) return;
  await saveNotificationHistory([
    {
      id,
      title: title || 'RMTA',
      body,
      type: data.type || 'general',
      at: message?.sentTime || Date.now(),
      read: false,
    },
    ...list,
  ]);
}

export async function markAllNotificationsRead() {
  const list = await getNotificationHistory();
  await saveNotificationHistory(list.map(n => ({ ...n, read: true })));
}

export async function markNotificationRead(id) {
  const list = await getNotificationHistory();
  await saveNotificationHistory(list.map(n => (n.id === id ? { ...n, read: true } : n)));
}

export async function clearNotificationHistory() {
  await saveNotificationHistory([]);
}
const CHANNELS = {
  general: { id: 'general', name: 'General', importance: AndroidImportance.HIGH },
  chat: { id: 'chat', name: 'Chat messages', importance: AndroidImportance.HIGH },
};

export async function createChannels() {
  await Promise.all(Object.values(CHANNELS).map(c => notifee.createChannel(c)));
}

// Android 13+ needs a runtime permission before notifications can show.
export async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

// Shows an FCM message through notifee. Chat messages use their own channel.
export async function displayRemoteMessage(message) {
  recordNotification(message).catch(() => {});
  const data = message?.data || {};
  const title = message?.notification?.title || data.title || 'RMTA';
  const body = message?.notification?.body || data.body || '';
  const channelId = data.type === 'chat' ? CHANNELS.chat.id : CHANNELS.general.id;
  await createChannels();
  await notifee.displayNotification({
    title,
    body,
    data,
    android: { channelId, pressAction: { id: 'default' }, smallIcon: 'ic_launcher' },
  });
}

// Registered in index.js: runs while the app is in the background or killed.
export function registerBackgroundHandlers() {
  setBackgroundMessageHandler(getMessaging(), async message => {
    // Messages that already carry a `notification` block are shown by the system.
    if (!message?.notification) await displayRemoteMessage(message);
  });
  notifee.onBackgroundEvent(async () => {});
}

// The device's FCM token: a fresh one when Firebase can give it, otherwise the
// last one saved on this device.
export async function getFcmToken() {
  try {
    const token = await getToken(getMessaging());
    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    }
  } catch (e) {
    console.warn('[FCM] token failed', e?.message);
  }
  return AsyncStorage.getItem(FCM_TOKEN_KEY);
}

export function onFcmTokenRefresh(callback) {
  return onTokenRefresh(getMessaging(), callback);
}

// Call once after login. Returns an unsubscribe function.
// `onOpen(data)` fires when the user taps a notification.
export async function initNotifications({ onOpen, onToken } = {}) {
  await createChannels();
  await requestNotificationPermission();
  try {
    const token = await getToken(getMessaging());
    console.log('[FCM] token', token);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    if (onToken) onToken(token);
  } catch (e) {
    console.warn('[FCM] token failed', e?.message);
  }

  const offToken = onTokenRefresh(getMessaging(), token => {
    AsyncStorage.setItem(FCM_TOKEN_KEY, token).catch(() => {});
    if (onToken) onToken(token);
  });
  const offMessage = onMessage(getMessaging(), async message => {
    console.log('[FCM] foreground message', JSON.stringify(message));
    await displayRemoteMessage(message);
  });
  const offOpened = onNotificationOpenedApp(getMessaging(), m => {
    recordNotification(m).catch(() => {}); // pushes shown by the system never pass displayRemoteMessage
    if (onOpen) onOpen(m?.data || {});
  });
  const offNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && onOpen) onOpen(detail.notification?.data || {});
  });

  const initial = await getInitialNotification(getMessaging());
  if (initial) recordNotification(initial).catch(() => {});
  if (initial && onOpen) onOpen(initial.data || {});

  return () => {
    offToken();
    offMessage();
    offOpened();
    offNotifee();
  };
}
