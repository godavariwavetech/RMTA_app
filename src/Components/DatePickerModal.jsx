import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../Constants/Colors';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "YYYY-MM-DD" <-> Date (local time, so there is no timezone shift)
export const toDateString = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDateString = v => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
export const formatDisplayDate = v => {
  const d = parseDateString(v);
  return d
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
};

// Calendar picker in a modal. `value` / `onConfirm` use "YYYY-MM-DD" strings.
export default function DatePickerModal({
  visible,
  value,
  minDate = new Date(),
  maxDate = null,
  onConfirm,
  onClose,
}) {
  // Pass minDate={null} to allow past dates; maxDate limits the other end.
  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;
  const initial = parseDateString(value) || min || startOfDay(new Date());
  const [selected, setSelected] = useState(initial);
  const [viewMonth, setViewMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  // Re-sync whenever the modal is opened.
  useEffect(() => {
    if (visible) {
      const d = parseDateString(value) || min || startOfDay(new Date());
      setSelected(d);
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const canGoPrev = !min || new Date(year, month, 0) >= min;

  const shiftMonth = delta => setViewMonth(new Date(year, month + delta, 1));

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.heading}>Select date</Text>

          <View style={styles.monthRow}>
            <Pressable
              onPress={() => canGoPrev && shiftMonth(-1)}
              style={[styles.navButton, !canGoPrev && styles.navDisabled]}
            >
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={() => shiftMonth(1)} style={styles.navButton}>
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={`${w}${i}`} style={styles.weekday}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={styles.cell} />;
              const disabled = (!!min && d < min) || (!!max && d > max);
              const isSelected = sameDay(d, selected);
              return (
                <Pressable
                  key={i}
                  style={styles.cell}
                  disabled={disabled}
                  onPress={() => setSelected(d)}
                >
                  <View style={[styles.day, isSelected && styles.daySelected]}>
                    <Text
                      style={[
                        styles.dayText,
                        disabled && styles.dayTextDisabled,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={() => onConfirm(toDateString(selected))}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
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
  heading: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.35 },
  navText: { fontSize: 22, color: Colors.primary, lineHeight: 26 },
  weekRow: { flexDirection: 'row', marginTop: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9CA3AF', paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', alignItems: 'center', paddingVertical: 3 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: Colors.primary },
  dayText: { fontSize: 14, color: '#1F2937' },
  dayTextDisabled: { color: '#D1D5DB' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  confirmButton: { backgroundColor: Colors.primary },
  confirmText: { color: '#FFFFFF', fontWeight: '600' },
});
