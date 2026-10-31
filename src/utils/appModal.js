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

// Icon + accent colour per dialog type. The type is taken from the optional
// 4th argument ({ type }) or guessed from the title/buttons, so the many
// existing Alert.alert calls pick up the right look without changes.
const TYPES = {
  success: { glyph: '✓', color: '#16A34A', tint: '#DCFCE7' },
  error: { glyph: '✕', color: '#DC2626', tint: '#FEE2E2' },
  warning: { glyph: '!', color: '#D97706', tint: '#FEF3C7' },
  confirm: { glyph: '?', color: '#1463D9', tint: '#DBEAFE' },
  info: { glyph: 'i', color: '#1463D9', tint: '#DBEAFE' },
};

function inferType(title, actions, explicit) {
  if (explicit && TYPES[explicit]) return explicit;
  const t = String(title).toLowerCase();
  if (actions.some(a => a.style === 'destructive')) return 'warning';
  if (/could not|couldn't|failed|error|invalid|incorrect|denied|wrong|unable|not found|rejected/.test(t)) return 'error';
  if (/incomplete|required|missing|no active|warning|limit|exceed|permission|not allowed/.test(t)) return 'warning';
  if (actions.some(a => a.style === 'cancel')) return 'confirm';
  // "already exists" / "already registered" are warnings; match whole words so "already"
  // is not mistaken for "ready".
  if (/\balready\b|\bexists?\b|\bduplicate\b/.test(t)) return 'warning';
  if (/success|created|saved|\bsent\b|complete|verified|\bdone\b|\bready\b|updated|added|resent/.test(t)) return 'success';
  return 'info';
}

// Two-button confirmation: Cancel + a confirm action.
export function confirmAction({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  type = 'confirm',
  destructive = false,
}) {
  showAppModal(
    title,
    message,
    [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, style: destructive ? 'destructive' : undefined, onPress: onConfirm },
    ],
    { type: destructive ? 'warning' : type },
  );
}

export function showAppModal(title, message, buttons, options) {
  // Keep Alert.alert's common calling convention so existing error and
  // confirmation flows are shown in the app's modal instead of a system alert.
  if (typeof message === 'function' || Array.isArray(message)) {
    options = buttons;
    buttons = message;
    message = '';
  }
  const actions = Array.isArray(buttons) && buttons.length
    ? buttons
    : [{ text: 'OK' }];
  const safeTitle = String(title || 'Message');
  publishModal({
    title: safeTitle,
    message: String(message || ''),
    actions,
    type: inferType(safeTitle, actions, options && options.type),
  });
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
  const theme = TYPES[modal?.type] || TYPES.info;

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
          {!isActionSheet && (
            <View style={[styles.iconCircle, { backgroundColor: theme.tint }]}>
              <View style={[styles.iconInner, { backgroundColor: theme.color }]}>
                <Text style={styles.iconGlyph}>{theme.glyph}</Text>
              </View>
            </View>
          )}
          <Text style={[styles.title, !isActionSheet && styles.centerText]}>{modal?.title}</Text>
          {!!modal?.message && (
            <Text style={[styles.message, !isActionSheet && styles.centerText]}>{modal.message}</Text>
          )}
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
            <View style={[styles.actions, modal?.actions.length === 2 && styles.actionsRow]}>
              {modal?.actions.map((action, index) => (
                <Pressable
                  key={`${action.text}-${index}`}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: theme.color },
                    action.style === 'cancel' && styles.cancelButton,
                    action.style === 'destructive' && styles.destructiveButton,
                    pressed && styles.buttonPressed,
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
    maxWidth: 380,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 16,
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
    fontWeight: '800',
  },
  message: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14.5,
    lineHeight: 21,
  },
  actions: {
    marginTop: 22,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    includeFontPadding: false,
  },
  centerText: {
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
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
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
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
    color: '#FFFFFF',
  },
});
