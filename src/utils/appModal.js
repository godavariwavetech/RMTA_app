import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

let activeModal = null;
const listeners = new Set();

function publishModal(nextModal) {
  activeModal = nextModal;
  listeners.forEach(listener => listener(activeModal));
}

export function showAppModal(title, message, buttons) {
  // Keep Alert.alert's common calling convention so existing error and
  // confirmation flows are shown in the app's modal instead of a system alert.
  if (typeof message === 'function' || Array.isArray(message)) {
    buttons = message;
    message = '';
  }
  const actions = Array.isArray(buttons) && buttons.length
    ? buttons
    : [{ text: 'OK' }];
  publishModal({ title: String(title || 'Message'), message: String(message || ''), actions });
}

export function installAppModalAlerts() {
  Alert.alert = showAppModal;
  globalThis.alert = message => showAppModal('Message', String(message || ''));
}

export function AppModalHost() {
  const [modal, setModal] = useState(activeModal);

  useEffect(() => {
    const listener = nextModal => setModal(nextModal);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const close = () => publishModal(null);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!modal}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{modal?.title}</Text>
          {!!modal?.message && <Text style={styles.message}>{modal.message}</Text>}
          <View style={styles.actions}>
            {modal?.actions.map((action, index) => (
              <Pressable
                key={`${action.text}-${index}`}
                style={[
                  styles.button,
                  action.style === 'cancel' && styles.cancelButton,
                  action.style === 'destructive' && styles.destructiveButton,
                ]}
                onPress={() => {
                  close();
                  action.onPress?.();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    action.style === 'cancel' && styles.cancelText,
                    action.style === 'destructive' && styles.destructiveText,
                  ]}
                >
                  {action.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#FFFFFF',
    elevation: 12,
  },
  title: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '700',
  },
  message: {
    marginTop: 10,
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: 20,
    marginHorizontal: -4,
  },
  button: {
    minHeight: 42,
    minWidth: 76,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginTop: 6,
    backgroundColor: '#1463D9',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelText: {
    color: '#374151',
  },
  destructiveText: {
    color: '#B91C1C',
  },
});
