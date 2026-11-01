import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../Constants/Colors';
import { PDF_SIZES } from '../utils/pdfSizes';

// Asks which paper size the PDF should be made for. onSelect gets 'a4' or
// 'thermal'.
export default function PdfSizeModal({ visible, onSelect, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Choose PDF size</Text>
          <Text style={styles.subtitle}>Pick the paper this PDF is for.</Text>

          {Object.values(PDF_SIZES).map(size => (
            <Pressable
              key={size.key}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => onSelect(size.key)}
            >
              <View style={[styles.preview, size.key === 'thermal' ? styles.previewThermal : styles.previewA4]} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{size.label}</Text>
                <Text style={styles.optionSub}>{size.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionPressed: { backgroundColor: '#F3F6FF', borderColor: Colors.primary },
  preview: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 3, backgroundColor: '#EEF3FF' },
  previewA4: { width: 28, height: 38 },
  previewThermal: { width: 18, height: 38 },
  optionText: { flex: 1, marginLeft: 14 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  optionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 22, color: '#9CA3AF' },
  cancel: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
});
