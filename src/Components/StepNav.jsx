import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../Constants/Colors';

// Footer row for the multi-step forms: a "Previous" button beside the step's
// own primary button (Next / Create ...), passed as children. Going back keeps
// what was entered because each step saves its draft before leaving.
export default function StepNav({ onPrev, children }) {
  return (
    <View style={styles.row}>
      {!!onPrev && (
        <TouchableOpacity style={styles.prev} onPress={onPrev} activeOpacity={0.8}>
          <Text style={styles.prevText}>‹ Previous</Text>
        </TouchableOpacity>
      )}
      <View style={styles.primary}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  primary: { flex: 1 },
  prev: {
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevText: { color: Colors.secondary, fontSize: 15, fontWeight: '700' },
});
