import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { confirmAction, showAppActionSheet } from '../../utils/appModal';
import {
  chatIdFor,
  markRead,
  saveUserProfile,
  sendMessage,
  sendGroupMessage,
  ensureRmtaGroup,
  editMessage,
  deleteMessage,
  setMemberLocked,
  subscribeChats,
  subscribeMessages,
} from '../../services/chatService';

// TEST MODE: every logged-in account gets the group admin powers (lock members, delete
// anyone's message) so they can be tried with the current account. Set to false to give
// them to admin-role accounts only.
const CHAT_ADMIN_FOR_ALL = true;

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
// A steady colour per sender so each person's name looks the same every time.
const SENDER_COLORS = ['#2563EB', '#DB2777', '#059669', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#4D7C0F'];
const senderColor = id => {
  const n = String(id)
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return SENDER_COLORS[n % SENDER_COLORS.length];
};
const fmtTime = ms => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatScreen({ onNavigate }) {
  const user = useSelector(state => state.auth?.user) || {};
  const me = String(user.member_id ?? user.id ?? '');
  const meName = user.name || user.full_name || '';
  const isChatAdmin = CHAT_ADMIN_FOR_ALL || user.role === 'admin';

  const [active, setActive] = useState(null);
  const [chats, setChats] = useState({});
  const [groups, setGroups] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
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

  // Everyone is in the built-in RMTA group: create it if needed and make sure all
  // members are in it.
  useEffect(() => {
    if (!me || !list.length) return;
    const members = list.map(u => ({ id: userIdOf(u), name: nameOf(u) }));
    ensureRmtaGroup({ me, meName, members }).catch(e =>
      console.warn('[chat] rmta group failed', e?.code, e?.message),
    );
  }, [me, meName, list]);

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
        const groupRows = [];
        rows.forEach(c => {
          if (c.isGroup) {
            groupRows.push(c);
            return;
          }
          const peer = (c.participants || []).find(p => p !== me);
          if (peer) byPeer[peer] = { ...c, peer, peerName: c.names?.[peer] };
        });
        setChats(byPeer);
        setGroups(groupRows);
      },
      err => {
        console.warn('[chat] chats listener', err?.code, err?.message);
        setSyncError(err?.message || 'Could not load chats.');
      },
    );
  }, [me, meName]);

  // Supporters plus anyone you already talk to who is not in that list.
  const everyone = useMemo(() => {
    const rows = list
      .map(u => ({ id: userIdOf(u), name: nameOf(u), sub: u.shop_name || u.mobile_number || u.phone_number }))
      .filter(r => r.id !== me);
    const known = new Set(rows.map(r => r.id));
    Object.values(chats).forEach(c => {
      if (!known.has(c.peer)) rows.push({ id: c.peer, name: c.peerName, sub: '' });
    });
    return rows;
  }, [list, chats, me]);

  // Groups first (newest activity on top), then people, both filtered by the search.
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groupRows = groups
      .map(g => ({
        id: g.id,
        name: g.groupName || 'Group',
        isGroup: true,
        participants: g.participants,
        chat: g,
      }))
      .filter(g => !q || g.name.toLowerCase().includes(q))
      .sort((a, b) => (b.chat.lastAtMs || 0) - (a.chat.lastAtMs || 0));
    const personRows = everyone
      .filter(r => !q || `${r.name || ''} ${r.sub || ''}`.toLowerCase().includes(q))
      .sort((a, b) => (chats[b.id]?.lastAtMs || 0) - (chats[a.id]?.lastAtMs || 0));
    if (groupRows.length) groupRows[0] = { ...groupRows[0], sectionLabel: 'Groups' };
    if (personRows.length) personRows[0] = { ...personRows[0], sectionLabel: 'Chats' };
    return [...groupRows, ...personRows];
  }, [everyone, groups, chats, query]);

  // Members of the open group: names come from the group record, falling back to the
  // member list.
  const activeGroup = active && active.isGroup ? groups.find(g => g.id === active.id) : null;
  const groupMembers = useMemo(() => {
    if (!activeGroup) return [];
    return (activeGroup.participants || [])
      .map(id => ({
        id,
        name:
          activeGroup.names?.[id] || everyone.find(p => p.id === id)?.name || `Member ${id}`,
        isMe: id === me,
        locked: !!activeGroup.locked?.[id],
      }))
      .sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : a.name.localeCompare(b.name)));
  }, [activeGroup, everyone, me]);

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
          {!!activeGroup && (
            <TouchableOpacity style={styles.membersBtn} onPress={() => setShowMembers(true)} activeOpacity={0.85}>
              <Text style={styles.membersBtnText}>👥 {groupMembers.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!me ? (
          <Text style={styles.empty}>Log in to use chat.</Text>
        ) : active ? (
          <Conversation
            peer={active}
            me={me}
            meName={meName}
            isChatAdmin={isChatAdmin}
            chat={active.isGroup ? groups.find(g => g.id === active.id) : chats[active.id]}
          />
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
                keyExtractor={p => `${p.isGroup ? 'g' : 'p'}_${p.id}`}
                contentContainerStyle={styles.userList}
                refreshing={loading}
                onRefresh={loadMembers}
                ListEmptyComponent={<Text style={styles.empty}>{error || 'No users found.'}</Text>}
                renderItem={({ item }) => {
                  const c = item.isGroup ? item.chat : chats[item.id];
                  const unread = Number(c?.unread?.[me]) || 0;
                  const lastSender =
                    c && c.lastFrom
                      ? c.lastFrom === me
                        ? 'You'
                        : (c.names && c.names[c.lastFrom]) || ''
                      : '';
                  return (
                    <View>
                    {!!item.sectionLabel && <Text style={styles.sectionLabel}>{item.sectionLabel}</Text>}
                    <TouchableOpacity
                      style={[styles.userRow, item.isGroup && styles.groupRow]}
                      onPress={() => setActive(item)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.avatar, item.isGroup && styles.groupAvatar]}>
                        <Text style={[styles.avatarText, item.isGroup && styles.groupAvatarText]}>
                          {item.isGroup ? '👥' : (item.name || 'U').trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userText}>
                        <View style={styles.nameLine}>
                          <Text
                            style={[styles.userName, item.isGroup && styles.groupName, unread > 0 && styles.userNameUnread]}
                            numberOfLines={1}
                          >
                            {item.name || 'Unnamed user'}
                          </Text>
                          {item.isGroup && <Text style={styles.groupTag}>GROUP</Text>}
                        </View>
                        <Text style={[styles.userSub, unread > 0 && styles.userSubUnread]} numberOfLines={1}>
                          {c
                            ? item.isGroup
                              ? `${lastSender ? `${lastSender}: ` : ''}${c.lastMessage}`
                              : `${c.lastFrom === me ? 'You: ' : ''}${c.lastMessage}`
                            : item.sub || 'Tap to start chatting'}
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
                    </View>
                  );
                }}
              />
            )}
          </>
        )}
        <Modal
          visible={showMembers}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMembers(false)}
        >
          <View style={styles.sheetScrim}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {activeGroup?.groupName || 'Group'} · {groupMembers.length} members
                </Text>
                <TouchableOpacity onPress={() => setShowMembers(false)} hitSlop={8}>
                  <Text style={styles.sheetClose}>Close</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={groupMembers}
                keyExtractor={m => m.id}
                renderItem={({ item }) => (
                  <View style={styles.memberRow}>
                    <View style={[styles.memberAvatar, { backgroundColor: senderColor(item.id) }]}>
                      <Text style={styles.memberAvatarText}>
                        {(item.name || 'U').trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberText}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.locked && <Text style={styles.lockedTag}>🔒 Can't send messages</Text>}
                    </View>
                    {item.isMe ? (
                      <Text style={styles.youTag}>You</Text>
                    ) : (
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={styles.memberBtn}
                          onPress={() => {
                            setShowMembers(false);
                            setActive({ id: item.id, name: item.name });
                          }}
                        >
                          <Text style={styles.memberBtnText}>Chat</Text>
                        </TouchableOpacity>
                        {isChatAdmin && (
                          <TouchableOpacity
                            style={[styles.memberBtn, item.locked ? styles.unlockBtn : styles.lockBtn]}
                            onPress={() =>
                              setMemberLocked({ chatId: activeGroup.id, memberId: item.id, locked: !item.locked }).catch(
                                e => console.warn('[chat] lock failed', e?.code, e?.message),
                              )
                            }
                          >
                            <Text style={[styles.memberBtnText, !item.locked && styles.lockBtnText]}>
                              {item.locked ? 'Unlock' : 'Lock'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

function Conversation({ peer, me, meName, chat, isChatAdmin }) {
  const isGroup = !!peer.isGroup;
  const chatId = isGroup ? peer.id : chatIdFor(me, peer.id);
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null); // message being replied to
  const [editing, setEditing] = useState(null); // message being edited
  const listRef = useRef(null);
  // A locked member cannot send in a group.
  const lockedMe = isGroup && !!chat?.locked?.[me];

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

  const lastMessageId = messages.length ? messages[messages.length - 1].id : null;

  const send = async () => {
    const body = text.trim();
    if (!body || lockedMe) return;
    const reply = replyTo
      ? {
          id: replyTo.id,
          from: replyTo.from,
          fromName: replyTo.from === me ? meName : replyTo.fromName || chat?.names?.[replyTo.from] || '',
          text: String(replyTo.text || '').slice(0, 80),
        }
      : null;
    const edit = editing;
    setText('');
    setReplyTo(null);
    setEditing(null);
    try {
      if (edit) {
        if (body !== edit.text) {
          await editMessage({ chatId, messageId: edit.id, text: body, isLast: edit.id === lastMessageId });
        }
      } else if (isGroup) {
        await sendGroupMessage({
          chatId,
          me,
          meName,
          participants: chat?.participants || peer.participants || [],
          text: body,
          replyTo: reply,
        });
      } else {
        await sendMessage({ me, meName, peer: peer.id, peerName: peer.name, text: body, replyTo: reply });
      }
    } catch (e) {
      console.warn('[chat] send failed', e?.code, e?.message);
      setError(e?.message || 'Message could not be sent.');
    }
  };

  // Long-press a message: Reply, Edit (your own) and Delete (your own; any message for admins).
  const openActions = item => {
    if (item.deleted || item.pending || lockedMe) return;
    const mineMsg = item.from === me;
    const actions = [
      {
        text: 'Reply',
        icon: '↩',
        onPress: () => {
          setEditing(null);
          setReplyTo(item);
        },
      },
    ];
    if (mineMsg) {
      actions.push({
        text: 'Edit',
        icon: '✎',
        onPress: () => {
          setReplyTo(null);
          setEditing(item);
          setText(item.text);
        },
      });
    }
    if (mineMsg || (isGroup && isChatAdmin)) {
      actions.push({
        text: 'Delete',
        icon: '🗑',
        subtitle: mineMsg ? undefined : 'Delete as admin',
        onPress: () =>
          confirmAction({
            title: 'Delete message?',
            message: 'This message will be removed for everyone.',
            confirmText: 'Delete',
            destructive: true,
            onConfirm: () =>
              deleteMessage({ chatId, messageId: item.id, isLast: item.id === lastMessageId }).catch(e => {
                console.warn('[chat] delete failed', e?.code, e?.message);
                setError(e?.message || 'Could not delete the message.');
              }),
          }),
      });
    }
    showAppActionSheet('Message', String(item.text || '').slice(0, 60), actions);
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
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.empty}>
              {isGroup ? 'No messages yet. Say hello to the group!' : 'No messages yet. Say hello!'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.from === me;
          return (
            <TouchableOpacity
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              activeOpacity={0.9}
              onLongPress={() => openActions(item)}
              delayLongPress={300}
            >
              {isGroup && (
                <Text
                  style={[styles.sender, { color: mine ? 'rgba(255,255,255,0.9)' : senderColor(item.from) }]}
                  numberOfLines={1}
                >
                  {mine ? 'You' : item.fromName || chat?.names?.[item.from] || 'Member'}
                </Text>
              )}
              {!!item.replyTo && !item.deleted && (
                <View style={[styles.quote, mine && styles.quoteMine]}>
                  <Text style={[styles.quoteName, mine && styles.quoteNameMine]} numberOfLines={1}>
                    {item.replyTo.from === me ? 'You' : item.replyTo.fromName || 'Member'}
                  </Text>
                  <Text style={[styles.quoteText, mine && styles.quoteTextMine]} numberOfLines={2}>
                    {item.replyTo.text}
                  </Text>
                </View>
              )}
              {item.deleted ? (
                <Text style={[styles.msg, styles.deletedMsg, mine && styles.deletedMsgMine]}>
                  🚫 This message was deleted
                </Text>
              ) : (
                <Text style={[styles.msg, mine && styles.msgMine]}>{item.text}</Text>
              )}
              <Text style={[styles.time, mine && styles.timeMine]}>
                {item.edited && !item.deleted ? 'edited · ' : ''}
                {item.pending ? 'Sending…' : fmtTime(item.time)}
                {mine && !item.pending && !isGroup && (
                  <Text style={item.time <= peerReadMs ? styles.tickRead : undefined}>
                    {item.time <= peerReadMs ? '  ✓✓' : '  ✓'}
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {lockedMe ? (
        <View style={styles.lockedBar}>
          <Text style={styles.lockedBarText}>🔒 An admin has turned off sending for you in this group.</Text>
        </View>
      ) : (
        <>
          {(replyTo || editing) && (
            <View style={styles.contextBar}>
              <View style={styles.contextBody}>
                <Text style={styles.contextTitle}>
                  {editing
                    ? 'Editing message'
                    : `Replying to ${replyTo.from === me ? 'yourself' : replyTo.fromName || chat?.names?.[replyTo.from] || 'member'}`}
                </Text>
                <Text style={styles.contextText} numberOfLines={1}>
                  {(editing || replyTo).text}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setReplyTo(null);
                  setEditing(null);
                  setText('');
                }}
                hitSlop={8}
              >
                <Text style={styles.contextClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={editing ? 'Edit your message' : 'Type a message'}
              placeholderTextColor="#94A3B8"
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send}>
              <Text style={styles.sendText}>{editing ? 'Save' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupRow: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.secondary,
    borderWidth: 1.5,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  groupAvatar: { backgroundColor: Colors.secondary },
  groupAvatarText: { fontSize: 20, color: '#FFFFFF' },
  nameLine: { flexDirection: 'row', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: '800', color: Colors.primary, flexShrink: 1 },
  groupTag: {
    marginLeft: 8,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: Colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  membersBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  membersBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  sheetScrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', flex: 1 },
  sheetClose: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  youTag: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
  sender: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 5,
  },
  quoteMine: { borderLeftColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.18)' },
  quoteName: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
  quoteNameMine: { color: '#FFFFFF' },
  quoteText: { fontSize: 12, color: '#475569' },
  quoteTextMine: { color: 'rgba(255,255,255,0.9)' },
  deletedMsg: { fontStyle: 'italic', color: '#94A3B8' },
  deletedMsgMine: { color: 'rgba(255,255,255,0.7)' },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contextBody: { flex: 1 },
  contextTitle: { fontSize: 12, fontWeight: '800', color: Colors.secondary },
  contextText: { fontSize: 12, color: '#475569', marginTop: 1 },
  contextClose: { fontSize: 16, color: '#64748B', paddingHorizontal: 8 },
  lockedBar: { backgroundColor: '#FEF2F2', borderTopWidth: 1, borderTopColor: '#FECACA', padding: 14 },
  lockedBarText: { textAlign: 'center', color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  memberText: { flex: 1 },
  lockedTag: { fontSize: 11, color: '#B91C1C', marginTop: 1 },
  memberActions: { flexDirection: 'row' },
  memberBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  memberBtnText: { fontSize: 12, fontWeight: '800', color: Colors.secondary },
  lockBtn: { backgroundColor: '#FEE2E2' },
  lockBtnText: { color: '#B91C1C' },
  unlockBtn: { backgroundColor: '#DCFCE7' },
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
