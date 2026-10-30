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
  serverTimestamp,
} from '@react-native-firebase/firestore';

// Firestore layout
//   users/{memberId}                  { name, fcmToken, updatedAt }
//   chats/{chatId}                    { participants: [a, b], names: {a, b},
//                                       lastMessage, lastFrom, lastAt }
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
          .map(d => ({ id: d.id, ...d.data(), lastAtMs: toMillis(d.data().lastAt) }))
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
    },
    { merge: true },
  );
  await addDoc(collection(db(), 'chats', chatId, 'messages'), {
    from: String(me),
    text,
    createdAt: serverTimestamp(),
  });
}
