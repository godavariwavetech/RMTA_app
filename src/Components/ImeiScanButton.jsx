import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import ImeiScannerModal from './ImeiScannerModal';

// A "scan" button that opens the camera IMEI scanner and hands the 15-digit number back.
//   <ImeiScanButton label="Scan IMEI 1" onScanned={imei => setImei1(imei)} />   // text link
//   <ImeiScanButton compact onScanned={imei => setSearch(imei)} />               // icon only (inside search boxes)
export default function ImeiScanButton({ onScanned, label = 'Scan', compact = false, style }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[compact ? styles.compact : styles.link, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={compact ? 'Scan IMEI' : label}
      >
        <Text style={compact ? styles.compactText : styles.linkText}>{compact ? '▦' : `▦  ${label}`}</Text>
      </TouchableOpacity>
      <ImeiScannerModal
        visible={open}
        onClose={() => setOpen(false)}
        onScanned={imei => {
          setOpen(false);
          onScanned(imei);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  linkText: { color: '#2F5DDC', fontSize: 13, fontWeight: '700' },
  compact: {
    marginLeft: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  compactText: { color: '#2F5DDC', fontSize: 16, fontWeight: '800' },
});
