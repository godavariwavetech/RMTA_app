import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../Constants/Colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';

// Dates are YYYY-MM-DD strings (the format the APIs take).
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYmd = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
};
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Tappable date field that opens a month calendar. Picking a day sets the value and closes.
export default function CalendarPicker({ label, value, onChange }) {
  const selected = parseYmd(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = selected || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const openPicker = () => {
    const d = parseYmd(value) || new Date();
    setView(new Date(d.getFullYear(), d.getMonth(), 1));
    setOpen(true);
  };
  const shiftMonth = n => setView(v => new Date(v.getFullYear(), v.getMonth() + n, 1));

  // Leading blanks so day 1 lands under its weekday, then the month's days, padded to full weeks.
  const cells = (() => {
    const lead = view.getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  })();

  const today = new Date();
  const pickDay = d => {
    onChange(ymd(d));
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={openPicker} activeOpacity={0.8} accessibilityRole="button">
        <Text style={selected ? styles.valueText : styles.placeholder}>
          {selected
            ? selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Select date'}
        </Text>
        <Text style={styles.icon}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn} accessibilityLabel="Previous month">
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn} accessibilityLabel="Next month">
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map(w => (
                <Text key={w} style={styles.weekday}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={`blank-${i}`} style={styles.cell} />;
                const isSelected = !!selected && sameDay(d, selected);
                const isToday = sameDay(d, today);
                return (
                  <TouchableOpacity
                    key={ymd(d)}
                    style={[styles.cell, isSelected && styles.cellSelected]}
                    onPress={() => pickDay(d)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.todayText,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  label: { fontSize: wp('3%'), color: '#6B7280', marginBottom: hp('0.5%') },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
  },
  valueText: { fontSize: wp('3.5%'), color: '#1F2937', fontWeight: '600' },
  placeholder: { fontSize: wp('3.5%'), color: '#999999' },
  icon: { fontSize: wp('3.5%'), color: '#6B7280', marginLeft: wp('2%') },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: wp('6%'),
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    padding: wp('4%'),
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  navBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  navText: { fontSize: wp('6%'), color: '#1F2937', lineHeight: wp('7%') },
  monthTitle: { fontSize: wp('4%'), fontWeight: '700', color: '#1F2937' },
  weekRow: { flexDirection: 'row', marginBottom: hp('0.5%') },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: wp('10%'),
  },
  cellSelected: { backgroundColor: Colors.secondary },
  dayText: { fontSize: wp('3.5%'), color: '#1F2937' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  todayText: { color: Colors.secondary, fontWeight: '700' },
  cancel: {
    marginTop: hp('1.5%'),
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  cancelText: { color: Colors.secondary, fontWeight: '700', fontSize: wp('3.8%') },
});
