import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { getJson } from '../../redux/slices/authSlice';
import { SkeletonUserList } from '../../Components/Skeleton';
import { FCM_TOKEN_KEY } from '../../services/notifications';
import {
  chatIdFor,
  markRead,
  saveUserProfile,
  sendMessage,
  subscribeChats,
  subscribeMessages,
} from '../../services/chatService';

// Live chat on Cloud Firestore. The list shows the people you can message
// (from `getallmembers`) with the latest message of each conversation, and
// opening one streams its messages in real time.
const userIdOf = u => String(u.member_id ?? u.id ?? u.user_id);
const nameOf = u => u.name || u.full_name || u.member_name || u.technician_name || '';

// getallmembers is a GET call; the response may be a plain array or wrapped
// in `data`, `members` or `result`.
async function fetchMembers() {
  const { response, data } = await getJson(ENDPOINTS.GET_ALL_MEMBERS);
  const rows = Array.isArray(data) ? data : data?.data || data?.members || data?.result;
  if (!response.ok || !Array.isArray(rows)) {
    throw new Error((data && (data.message || data.msg)) || `Could not load members (${response.status}).`);
  }
  return rows.filter(r => !Number(r.d_in));
}
const fmtTime = ms => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatScreen({ onNavigate }) {
  const user = useSelector(state => state.auth?.user) || {};
  const me = String(user.member_id ?? user.id ?? '');
  const meName = user.name || user.full_name || '';

  const [active, setActive] = useState(null);
  const [chats, setChats] = useState({});
  const [query, setQuery] = useState('');
  const [syncError, setSyncError] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setList(await fetchMembers());
    } catch (e) {
      setError(e.message || 'Could not load members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Register this device for pushes and stream the member's conversations.
  useEffect(() => {
    if (!me) return undefined;
    AsyncStorage.getItem(FCM_TOKEN_KEY)
      .then(fcmToken => saveUserProfile(me, { name: meName, fcmToken }))
      .catch(e => console.warn('[chat] profile save failed', e?.message));
    return subscribeChats(
      me,
      rows => {
        setSyncError('');
        const byPeer = {};
        rows.forEach(c => {
          const peer = (c.participants || []).find(p => p !== me);
          if (peer) byPeer[peer] = { ...c, peer, peerName: c.names?.[peer] };
        });
        setChats(byPeer);
      },
      err => {
        console.warn('[chat] chats listener', err?.code, err?.message);
        setSyncError(err?.message || 'Could not load chats.');
      },
    );
  }, [me, meName]);

  // Supporters plus anyone you already talk to who is not in that list.
  const people = useMemo(() => {
    const rows = list
      .map(u => ({ id: userIdOf(u), name: nameOf(u), sub: u.shop_name || u.mobile_number || u.phone_number }))
      .filter(r => r.id !== me);
    const known = new Set(rows.map(r => r.id));
    Object.values(chats).forEach(c => {
      if (!known.has(c.peer)) rows.push({ id: c.peer, name: c.peerName, sub: '' });
    });
    const q = query.trim().toLowerCase();
    return rows
      .filter(r => !q || `${r.name || ''} ${r.sub || ''}`.toLowerCase().includes(q))
      .sort((a, b) => (chats[b.id]?.lastAtMs || 0) - (chats[a.id]?.lastAtMs || 0));
  }, [list, chats, query, me]);

  const back = () => (active ? setActive(null) : onNavigate('goBack'));

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={back} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {active ? active.name || 'Chat' : 'Chat'}
          </Text>
        </View>

        {!me ? (
          <Text style={styles.empty}>Log in to use chat.</Text>
        ) : active ? (
          <Conversation peer={active} me={me} meName={meName} chat={chats[active.id]} />
        ) : (
          <>
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search users"
                placeholderTextColor="#94A3B8"
              />
            </View>
            {!!syncError && <Text style={styles.errorBar}>{syncError}</Text>}
            {loading && !list.length ? (
              <SkeletonUserList />
            ) : (
              <FlatList
                data={people}
                keyExtractor={p => p.id}
                contentContainerStyle={styles.userList}
                refreshing={loading}
                onRefresh={loadMembers}
                ListEmptyComponent={<Text style={styles.empty}>{error || 'No users found.'}</Text>}
                renderItem={({ item }) => {
                  const c = chats[item.id];
                  const unread = Number(c?.unread?.[me]) || 0;
                  return (
                    <TouchableOpacity style={styles.userRow} onPress={() => setActive(item)} activeOpacity={0.8}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(item.name || 'U').trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userText}>
                        <Text style={[styles.userName, unread > 0 && styles.userNameUnread]} numberOfLines={1}>
                          {item.name || 'Unnamed user'}
                        </Text>
                        <Text style={[styles.userSub, unread > 0 && styles.userSubUnread]} numberOfLines={1}>
                          {c ? `${c.lastFrom === me ? 'You: ' : ''}${c.lastMessage}` : item.sub || 'Tap to start chatting'}
                        </Text>
                      </View>
                      {c && (
                        <View style={styles.rowMeta}>
                          <Text style={[styles.rowTime, unread > 0 && styles.rowTimeUnread]}>{fmtTime(c.lastAtMs)}</Text>
                          {unread > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </>
  );
}

function Conversation({ peer, me, meName, chat }) {
  const chatId = chatIdFor(me, peer.id);
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(
    () =>
      subscribeMessages(
        chatId,
        rows => {
          setMessages(rows);
          setLoaded(true);
          setError('');
        },
        err => {
          console.warn('[chat] messages listener', err?.code, err?.message);
          setError(err?.message || 'Could not load messages.');
          setLoaded(true);
        },
      ),
    [chatId],
  );

  // Tell the other side we've read their messages and clear our unread badge.
  const unreadMine = Number(chat?.unread?.[me]) || 0;
  const myReadMs = chat?.readAtMs?.[me] || 0;
  const peerReadMs = chat?.readAtMs?.[peer.id] || 0;
  const lastPeerMsgMs = messages.reduce((t, m) => (m.from !== me ? Math.max(t, m.time) : t), 0);
  useEffect(() => {
    if (!loaded || (!unreadMine && lastPeerMsgMs <= myReadMs)) return;
    markRead(chatId, me).catch(e => console.warn('[chat] markRead failed', e?.message));
  }, [loaded, chatId, me, unreadMine, lastPeerMsgMs, myReadMs]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await sendMessage({ me, meName, peer: peer.id, peerName: peer.name, text: body });
    } catch (e) {
      console.warn('[chat] send failed', e?.code, e?.message);
      setError(e?.message || 'Message could not be sent.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!!error && <Text style={styles.errorBar}>{error}</Text>}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={loaded ? <Text style={styles.empty}>No messages yet. Say hello!</Text> : null}
        renderItem={({ item }) => {
          const mine = item.from === me;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.msg, mine && styles.msgMine]}>{item.text}</Text>
              <Text style={[styles.time, mine && styles.timeMine]}>
                {item.pending ? 'Sending…' : fmtTime(item.time)}
                {mine && !item.pending && (
                  <Text style={item.time <= peerReadMs ? styles.tickRead : undefined}>
                    {item.time <= peerReadMs ? '  ✓✓' : '  ✓'}
                  </Text>
                )}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          placeholderTextColor="#94A3B8"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, includeFontPadding: false },
  title: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginLeft: 6 },

  searchWrap: { paddingHorizontal: 14, paddingTop: 12 },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  userList: { padding: 14, flexGrow: 1 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.secondary },
  userText: { flex: 1, marginHorizontal: 12 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  userSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  userNameUnread: { color: '#0F172A' },
  userSubUnread: { color: '#1F2937', fontWeight: '600' },
  rowMeta: { alignItems: 'flex-end' },
  rowTime: { fontSize: 11, color: '#94A3B8' },
  rowTimeUnread: { color: Colors.secondary, fontWeight: '700' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    marginTop: 4,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 13 },
  errorBar: { backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: 12, padding: 8, textAlign: 'center' },

  list: { padding: 14, flexGrow: 1 },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  msg: { fontSize: 14, color: '#1F2937' },
  msgMine: { color: '#FFFFFF' },
  time: { fontSize: 10, color: '#94A3B8', marginTop: 3, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  tickRead: { color: '#7DD3FC', fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#FFFFFF' },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  sendBtn: { marginLeft: 8, backgroundColor: Colors.secondary, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: '#FFFFFF', fontWeight: '700' },
});
