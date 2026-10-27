import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export function showAppActionSheet(title, message, actions) {
  publishModal({
    variant: 'actionSheet',
    title: String(title || ''),
    message: String(message || ''),
    actions: Array.isArray(actions) ? actions : [],
  });
}

export function installAppModalAlerts() {
  Alert.alert = showAppModal;
  globalThis.alert = message => showAppModal('Message', String(message || ''));
}

export function AppModalHost() {
  const [modal, setModal] = useState(activeModal);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const listener = nextModal => setModal(nextModal);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const close = () => publishModal(null);
  const isActionSheet = modal?.variant === 'actionSheet';

  return (
    <Modal
      transparent
      animationType={isActionSheet ? 'slide' : 'fade'}
      visible={!!modal}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={[styles.scrim, isActionSheet && styles.sheetScrim]}>
        <View
          style={[
            styles.card,
            isActionSheet && styles.sheet,
            isActionSheet && { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {isActionSheet && <View style={styles.grabber} />}
          <Text style={styles.title}>{modal?.title}</Text>
          {!!modal?.message && <Text style={styles.message}>{modal.message}</Text>}
          {isActionSheet ? (
            <View style={styles.sheetOptions}>
              {modal?.actions.map((action, index) => (
                <Pressable
                  key={`${action.text}-${index}`}
                  style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
                  onPress={() => {
                    close();
                    action.onPress?.();
                  }}
                >
                  {!!action.icon && (
                    <View style={styles.optionIconWrap}>
                      <Text style={styles.optionIcon}>{action.icon}</Text>
                    </View>
                  )}
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>{action.text}</Text>
                    {!!action.subtitle && (
                      <Text style={styles.optionSubtitle}>{action.subtitle}</Text>
                    )}
                  </View>
                  <Text style={styles.optionChevron}>›</Text>
                </Pressable>
              ))}
              <Pressable style={styles.sheetCancel} onPress={close}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
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
          )}
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
  sheetScrim: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#FFFFFF',
    elevation: 12,
  },
  sheet: {
    width: '100%',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 18,
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
  sheetOptions: {
    marginTop: 16,
  },
  sheetOption: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  pressed: {
    backgroundColor: '#E8EEF7',
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E8F0FE',
  },
  optionIcon: {
    color: '#1456B8',
    fontSize: 20,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },
  optionChevron: {
    color: '#9CA3AF',
    fontSize: 25,
    marginLeft: 8,
  },
  sheetCancel: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    marginTop: 2,
    backgroundColor: '#F3F4F6',
  },
  sheetCancelText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
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
