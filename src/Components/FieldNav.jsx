import React, { useCallback, useRef } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Previous / Next / Done bar above the keyboard for forms with several fields.
// iOS number pads have no Next key, so the bar is the only way to move on;
// Android gets a "next" action key on the keyboard instead.
//
//   const nav = useFieldNav();
//   <TextInput {...nav.props(0)} ... />
//   <TextInput {...nav.props(1)} ... />
//   <FieldNavBar nav={nav} />
const ACCESSORY_ID = 'rmtaFieldNav';

export function useFieldNav() {
  const inputs = useRef({});
  const current = useRef(-1);

  const focusAt = useCallback(index => {
    const el = inputs.current[index];
    if (el) {
      el.focus();
    } else {
      Keyboard.dismiss();
    }
  }, []);

  // Neighbouring registered field in `step` direction (skips unmounted ones).
  const neighbour = step => {
    const order = Object.keys(inputs.current)
      .map(Number)
      .filter(i => inputs.current[i])
      .sort((a, b) => a - b);
    const pos = order.indexOf(current.current);
    return order[pos + step];
  };

  const next = () => {
    const i = neighbour(1);
    if (i === undefined) Keyboard.dismiss();
    else focusAt(i);
  };
  const prev = () => {
    const i = neighbour(-1);
    if (i !== undefined) focusAt(i);
  };

  const props = index => ({
    ref: el => {
      inputs.current[index] = el;
    },
    onFocus: () => {
      current.current = index;
    },
    inputAccessoryViewID: ACCESSORY_ID,
    returnKeyType: 'next',
    blurOnSubmit: false,
    onSubmitEditing: next,
  });

  return { props, next, prev };
}

export function FieldNavBar({ nav }) {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={ACCESSORY_ID}>
      <View style={styles.bar}>
        <View style={styles.group}>
          <TouchableOpacity onPress={nav.prev} style={styles.btn}>
            <Text style={styles.arrow}>‹ Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nav.next} style={styles.btn}>
            <Text style={styles.arrow}>Next ›</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={Keyboard.dismiss} style={styles.btn}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    paddingHorizontal: 8,
  },
  group: { flexDirection: 'row' },
  btn: { paddingVertical: 12, paddingHorizontal: 12 },
  arrow: { fontSize: 16, color: '#2F5DDC', fontWeight: '500' },
  done: { fontSize: 16, color: '#2F5DDC', fontWeight: '700' },
});

// Amount input filter: digits with at most one dot and two decimals.
export const sanitizeAmount = text => {
  const cleaned = String(text).replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
};
