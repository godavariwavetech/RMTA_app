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
  const chatData = chat.data() || {};
  // 1:1 chats notify the other person; group chats notify every member but the sender.
  const recipients = (chatData.participants || []).filter(p => p !== msg.from);
  if (!recipients.length) return;
  const senderName = msg.fromName || (chatData.names || {})[msg.from] || 'RMTA chat';
  const title = chatData.isGroup ? chatData.groupName || 'Group' : senderName;
  const body = chatData.isGroup ? `${senderName}: ${msg.text}` : msg.text;

  await Promise.all(
    recipients.map(async to => {
      const user = await db.doc(`users/${to}`).get();
      const token = user.data() && user.data().fcmToken;
      if (!token) return;
      await getMessaging().send({
        token,
        notification: { title, body },
        data: { type: 'chat', chatId: event.params.chatId, from: String(msg.from) },
        android: { priority: 'high', notification: { channelId: 'chat' } },
      });
    }),
  );
});
