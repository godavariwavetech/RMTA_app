import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Firestore layout
//   users/{memberId}                  { name, fcmToken, updatedAt }
//   chats/{chatId}                    { participants: [a, b], names: {a, b},
//                                       lastMessage, lastFrom, lastAt,
//                                       unread: {id: count}, readAt: {id: ts} }
//   chats/{chatId}/messages/{autoId}  { from, text, createdAt }
// chatId is the two member ids sorted and joined, so both sides share one doc.
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
          return { id: d.id, from: m.from, text: m.text, time: toMillis(m.createdAt), pending: d.metadata.hasPendingWrites };
        }),
      ),
    err => onError && onError(err),
  );
}

export async function sendMessage({ me, meName, peer, peerName, text }) {
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
