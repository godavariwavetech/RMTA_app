import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import BottomNav from '../../Components/BottomNav';
import { getJson } from '../../redux/slices/authSlice';
import useRefresh from '../../utils/useRefresh';
import {
  clearNotificationHistory,
  getNotificationHistory,
  mergeNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications';

// Look of each kind of notification: an emoji tile and its colours.
const TYPES = {
  chat: { glyph: '💬', bg: '#DBEAFE', fg: '#1D4ED8' },
  job: { glyph: '🛠️', bg: '#FEF3C7', fg: '#B45309' },
  purchase: { glyph: '📥', bg: '#EDE9FE', fg: '#6D28D9' },
  sale: { glyph: '📤', bg: '#FFEDD5', fg: '#C2410C' },
  member: { glyph: '✅', bg: '#DCFCE7', fg: '#15803D' },
  general: { glyph: '🔔', bg: '#E0E7FF', fg: '#4338CA' },
};
const typeOf = n => TYPES[n.type] || TYPES.general;
const EMPTY_USER = {};

const getNotificationRows = value => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return null;

  for (const key of ['data', 'notifications', 'app_notifications', 'notification_list', 'records', 'result']) {
    const rows = getNotificationRows(value[key]);
    if (rows) return rows;
  }
  return null;
};

const normalizeNotification = (row, index) => {
  const title = String(
    row.title || row.notification_title || row.heading || row.subject || 'RMTA',
  );
  const body = String(
    row.description || row.body || row.message || row.content || row.notification_message || '',
  );
  const rawAt =
    row.created_at || row.sent_at || row.i_ts || row.timestamp || row.date || row.notification_date;
  const parsedAt = typeof rawAt === 'number' ? rawAt : new Date(rawAt).getTime();
  const at = Number.isFinite(parsedAt) ? (parsedAt < 1e12 ? parsedAt * 1000 : parsedAt) : Date.now();
  const rawId = row.id ?? row.notification_id ?? row.app_notification_id;
  const id = String(rawId ?? `${at}-${index}-${title}`);
  const rawRead = row.read ?? row.is_read ?? row.read_status;

  return {
    id,
    title,
    body,
    type: String(row.type || row.notification_type || row.category || 'general').toLowerCase(),
    at,
    read: rawRead === true || rawRead === 1 || String(rawRead).toLowerCase() === 'true',
  };
};

const dayKey = ms => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// "now", "5 min ago", "2 h ago", "Yesterday", "24 Oct".
const timeAgo = ms => {
  const diff = Date.now() - ms;
  if (diff < 60 * 1000) return 'now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min ago`;
  if (dayKey(ms) === dayKey(Date.now())) return `${Math.floor(diff / 3600000)} h ago`;
  if (dayKey(ms) === dayKey(Date.now() - 86400000)) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen({ onNavigate }) {
  const { tick, refreshControl } = useRefresh();
  const user = useSelector(state => state.auth.user) || EMPTY_USER;
  const [selectedNavItem, setSelectedNavItem] = useState('home');
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    const localHistory = await getNotificationHistory();
    setItems(localHistory);
    setLoadError('');

    try {
      const { response, data } = await getJson(ENDPOINTS.GET_APP_NOTIFICATIONS, {
        user_id: user.user_id,
        member_id: user.member_id,
        tech_id: user.tech_id,
        user_ind: user.user_ind,
      });
      if (!response.ok) {
        throw new Error(
          response.status >= 500
            ? `The notification service is unavailable (HTTP ${response.status}). Pull down to try again.`
            : `Could not load notifications (HTTP ${response.status}).`,
        );
      }
      if (data && data.success === false) {
        throw new Error(data.message || 'Could not load notifications.');
      }

      const rows = getNotificationRows(data);
      if (!Array.isArray(rows)) {
        throw new Error('The server returned an invalid notifications list.');
      }

      const remoteNotifications = rows
        .filter(row => row && !Number(row.d_in))
        .map(normalizeNotification);
      setItems(await mergeNotificationHistory(remoteNotifications));
    } catch (error) {
      setLoadError(error.message || 'Could not load notifications.');
      console.warn('[notifications] fetch failed:', error.message);
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load, tick]);

  const handleNavigation = screen => {
    setSelectedNavItem(screen);
    if (onNavigate) onNavigate(screen);
  };

  const unread = items.filter(n => !n.read).length;

  const openItem = async item => {
    if (!item.read) {
      await markNotificationRead(item.id);
      load();
    }
    if (item.type === 'chat') onNavigate && onNavigate('chat');
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    load();
  };

  const clearAll = () => {
    Alert.alert('Clear all notifications?', 'This removes every notification from this list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearNotificationHistory();
          setItems([]);
        },
      },
    ]);
  };

  // Today, Yesterday, then older days.
  const sections = [];
  items.forEach(n => {
    const key = dayKey(n.at);
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.data.push(n);
    } else {
      const title =
        key === dayKey(Date.now())
          ? 'Today'
          : key === dayKey(Date.now() - 86400000)
          ? 'Yesterday'
          : new Date(n.at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      sections.push({ key, title, data: [n] });
    }
  });

  const renderItem = ({ item, index, section }) => {
    const look = typeOf(item);
    const first = index === 0;
    const last = index === section.data.length - 1;
    return (
      <TouchableOpacity
        style={[styles.row, first && styles.rowFirst, last && styles.rowLast, !item.read && styles.rowUnread]}
        activeOpacity={0.7}
        onPress={() => openItem(item)}
      >
        <View style={[styles.tile, { backgroundColor: look.bg }]}>
          <Text style={styles.tileGlyph}>{look.glyph}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowTime}>{timeAgo(item.at)}</Text>
          </View>
          {!!item.body && (
            <Text style={styles.rowText} numberOfLines={2}>
              {item.body}
            </Text>
          )}
        </View>
        {!last && <View style={styles.divider} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={true} />
      <SafeAreaView style={styles.container}>
        {/* Navy header: title, how many are unread, and quick actions */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => onNavigate && onNavigate('home')} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSub}>
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </Text>
            </View>
          </View>
          {items.length > 0 && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, unread === 0 && styles.actionOff]}
                onPress={markAll}
                disabled={unread === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.actionText}>✓  Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={clearAll} activeOpacity={0.8}>
                <Text style={styles.actionText}>🗑  Clear all</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            loadError && items.length > 0 ? <Text style={styles.errorText}>{loadError}</Text> : null
          }
          ListEmptyComponent={
            loaded ? (
              loadError ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.errorTitle}>Notifications unavailable</Text>
                  <Text style={styles.emptyText}>{loadError}</Text>
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <View style={styles.emptyRingOuter}>
                    <View style={styles.emptyRingInner}>
                      <Text style={styles.emptyGlyph}>🔔</Text>
                    </View>
                  </View>
                  <Text style={styles.emptyTitle}>You're up to date</Text>
                  <Text style={styles.emptyText}>
                    Job updates, chat messages and announcements will show up here.
                  </Text>
                </View>
              )
            ) : null
          }
        />

        {/* Bottom Navigation */}
        <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  backButtonText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, includeFontPadding: false },
  headerTitles: { marginLeft: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: 1 },
  actions: { flexDirection: 'row', marginTop: 14 },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  actionOff: { opacity: 0.4 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  listContent: { paddingHorizontal: 16, paddingBottom: 130, flexGrow: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10, marginLeft: 4 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', letterSpacing: 0.3, textTransform: 'uppercase' },

  row: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 3,
  },
  rowUnread: { backgroundColor: '#F5F8FF' },
  rowFirst: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  rowLast: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tileGlyph: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155', marginRight: 8 },
  rowTitleUnread: { fontWeight: '800', color: '#0F172A' },
  rowTime: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  rowText: { fontSize: 13, lineHeight: 18, color: '#64748B', marginTop: 3 },
  divider: {
    position: 'absolute',
    left: 70,
    right: 14,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
  },

  emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyGlyph: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#B91C1C', marginBottom: 6 },
  errorText: { color: '#B91C1C', fontSize: 13, marginTop: 16, textAlign: 'center' },
});
