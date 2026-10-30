import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '../Constants/Colors';

// One shared OTP entry: `length` boxes, digits always visible. Typing moves
// to the next box, backspace on an empty box clears and returns to the
// previous one, and pasting / SMS autofill of the whole code fills every box.
//
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   <OtpInput value={otp} onChange={setOtp} />
const OtpInput = forwardRef(function OtpInput(
  { value, onChange, length = 6, autoFocus = false, style },
  ref,
) {
  const inputs = useRef([]);

  useImperativeHandle(ref, () => ({
    focus: () => inputs.current[0]?.focus(),
  }));

  const focusAt = index => inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus();

  const handleChange = (text, index) => {
    let digits = text.replace(/\D/g, '');

    // Typing into a box that already has a digit: keep just the new one.
    if (digits.length === 2 && value[index]) {
      digits = digits.replace(value[index], '').slice(0, 1) || digits.slice(1);
    }

    const next = [...value];
    if (digits.length === 0) {
      next[index] = '';
      onChange(next);
      return;
    }

    // One digit fills this box; several (paste / autofill) spill into the rest.
    digits.slice(0, length - index).split('').forEach((d, i) => {
      next[index + i] = d;
    });
    onChange(next);
    focusAt(index + digits.length);
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      focusAt(index - 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={el => {
            inputs.current[index] = el;
          }}
          style={[styles.input, !!value[index] && styles.inputFilled]}
          value={value[index] || ''}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={event => handleKeyPress(event, index)}
          keyboardType="number-pad"
          maxLength={length}
          selectTextOnFocus
          secureTextEntry={false}
          textAlign="center"
          autoFocus={autoFocus && index === 0}
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={index === 0 ? 'sms-otp' : 'off'}
        />
      ))}
    </View>
  );
});

export default OtpInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  inputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F7F9FC',
  },
});
