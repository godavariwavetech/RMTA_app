import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDoc,
  arrayUnion,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Firestore layout
//   users/{memberId}                  { name, fcmToken, updatedAt }
//   chats/{chatId}                    { participants: [a, b], names: {a, b},
//                                       lastMessage, lastFrom, lastAt,
//                                       unread: {id: count}, readAt: {id: ts} }
//   chats/{chatId}/messages/{autoId}  { from, fromName, text, createdAt, edited?, deleted?, replyTo? }
//   chats/{chatId}.locked = { [memberId]: true }  members who may not send (group chats)
// chatId is the two member ids sorted and joined, so both sides share one doc.
// Group chats are chats/{autoId} with isGroup: true, groupName, createdBy and every
// member in participants; unread is counted per member.
const db = () => getFirestore();

export const chatIdFor = (a, b) => [String(a), String(b)].sort().join('_');

const toMillis = ts => (ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now());

// Keeps this device's FCM token on the member's user doc so a server-side
// function can push to them.
export function saveUserProfile(memberId, { name, fcmToken }) {
  if (!memberId) return Promise.resolve();
  const data = { updatedAt: serverTimestamp() };
  if (name) data.name = name;
  if (fcmToken) data.fcmToken = fcmToken;
  return setDoc(doc(db(), 'users', String(memberId)), data, { merge: true });
}

// Live list of this member's conversations. Returns the unsubscribe function.
export function subscribeChats(me, onData, onError) {
  const q = query(collection(db(), 'chats'), where('participants', 'array-contains', String(me)));
  return onSnapshot(
    q,
    snap =>
      onData(
        snap.docs
          .map(d => {
            const data = d.data();
            const readAtMs = {};
            Object.entries(data.readAt || {}).forEach(([id, ts]) => {
              readAtMs[id] = toMillis(ts);
            });
            return { id: d.id, ...data, lastAtMs: toMillis(data.lastAt), readAtMs };
          })
          .sort((x, y) => y.lastAtMs - x.lastAtMs),
      ),
    err => onError && onError(err),
  );
}

// Live messages for one conversation, oldest first.
export function subscribeMessages(chatId, onData, onError) {
  const q = query(collection(db(), 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    snap =>
      onData(
        snap.docs.map(d => {
          const m = d.data();
          return { id: d.id, from: m.from, fromName: m.fromName, text: m.text, edited: !!m.edited, deleted: !!m.deleted, replyTo: m.replyTo || null, time: toMillis(m.createdAt), pending: d.metadata.hasPendingWrites };
        }),
      ),
    err => onError && onError(err),
  );
}

export async function sendMessage({ me, meName, peer, peerName, text, replyTo }) {
  const chatId = chatIdFor(me, peer);
  await setDoc(
    doc(db(), 'chats', chatId),
    {
      participants: [String(me), String(peer)],
      names: { [String(me)]: meName || '', [String(peer)]: peerName || '' },
      lastMessage: text,
      lastFrom: String(me),
      lastAt: serverTimestamp(),
      // Peer's unread badge goes up by one for every message we send.
      unread: { [String(peer)]: increment(1) },
    },
    { merge: true },
  );
  await addDoc(collection(db(), 'chats', chatId, 'messages'), {
    from: String(me),
    text,
    ...(replyTo ? { replyTo } : {}),
    createdAt: serverTimestamp(),
  });
}

// Marks the conversation as read by `me`: clears the unread badge and stamps
// the time the other side uses to show "Read" under their messages.
export function markRead(chatId, me) {
  return setDoc(
    doc(db(), 'chats', chatId),
    { unread: { [String(me)]: 0 }, readAt: { [String(me)]: serverTimestamp() } },
    { merge: true },
  );
}

// The one built-in group every member belongs to. There is no "create group": the
// first client to open Chat creates it, and every client adds all the members it knows
// about (so people get its messages and unread counts even before they open it).
export const RMTA_GROUP_ID = 'rmta_group';

export async function ensureRmtaGroup({ me, meName, members }) {
  const ref = doc(db(), 'chats', RMTA_GROUP_ID);
  const ids = Array.from(new Set([String(me), ...members.map(m => String(m.id))]));
  const names = { [String(me)]: meName || '' };
  members.forEach(m => {
    if (m.name) names[String(m.id)] = m.name;
  });
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      isGroup: true,
      defaultGroup: true,
      groupName: 'RMTA',
      createdBy: String(me),
      participants: ids,
      names,
      lastMessage: 'Welcome to the RMTA group',
      lastFrom: '',
      lastAt: serverTimestamp(),
    });
    return;
  }
  await setDoc(ref, { participants: arrayUnion(...ids), names }, { merge: true });
}

// Sends a message to a group: every member except the sender gets +1 unread.
export async function sendGroupMessage({ chatId, me, meName, participants, text, replyTo }) {
  const unread = {};
  (participants || []).forEach(p => {
    if (String(p) !== String(me)) unread[String(p)] = increment(1);
  });
  await setDoc(
    doc(db(), 'chats', chatId),
    { lastMessage: text, lastFrom: String(me), lastAt: serverTimestamp(), unread },
    { merge: true },
  );
  await addDoc(collection(db(), 'chats', chatId, 'messages'), {
    from: String(me),
    fromName: meName || '',
    text,
    ...(replyTo ? { replyTo } : {}),
    createdAt: serverTimestamp(),
  });
}

// Edits the text of a message. `isLast` also refreshes the chat list preview.
export async function editMessage({ chatId, messageId, text, isLast }) {
  await updateDoc(doc(db(), 'chats', chatId, 'messages', messageId), { text, edited: true });
  if (isLast) await updateDoc(doc(db(), 'chats', chatId), { lastMessage: text });
}

// Soft-deletes a message: it stays in the list as "This message was deleted".
export async function deleteMessage({ chatId, messageId, isLast }) {
  await updateDoc(doc(db(), 'chats', chatId, 'messages', messageId), { deleted: true, text: '' });
  if (isLast) await updateDoc(doc(db(), 'chats', chatId), { lastMessage: 'Message deleted' });
}

// Lock or unlock a member of a group so they cannot send messages.
export function setMemberLocked({ chatId, memberId, locked }) {
  return setDoc(doc(db(), 'chats', chatId), { locked: { [String(memberId)]: !!locked } }, { merge: true });
}
