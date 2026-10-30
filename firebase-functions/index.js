// Cloud Function: pushes a notification to the other member when a chat
// message is created. Deploy with `firebase deploy --only functions`
// (needs the Blaze plan). Not part of the app bundle.
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

exports.onChatMessage = onDocumentCreated('chats/{chatId}/messages/{messageId}', async event => {
  const msg = event.data.data();
  const db = getFirestore();
  const chat = await db.doc(`chats/${event.params.chatId}`).get();
  const to = (chat.data().participants || []).find(p => p !== msg.from);
  if (!to) return;
  const user = await db.doc(`users/${to}`).get();
  const token = user.data() && user.data().fcmToken;
  if (!token) return;
  const fromName = (chat.data().names || {})[msg.from] || 'RMTA chat';
  await getMessaging().send({
    token,
    notification: { title: fromName, body: msg.text },
    data: { type: 'chat', chatId: event.params.chatId, from: String(msg.from) },
    android: { priority: 'high', notification: { channelId: 'chat' } },
  });
});
