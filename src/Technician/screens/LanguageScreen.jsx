import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';

import { Colors } from '../../Constants/Colors';
import { useI18n, LANGUAGES } from '../../i18n';
import { translations } from '../../i18n/translations';

// Language picker, opened from the intro screen or Settings / Profile.
export default function LanguageScreen({ onNavigate, fromSettings = false }) {
  const { language, setLanguage } = useI18n();
  const [selected, setSelected] = useState(language);

  // The screen's own text previews the language that is currently selected.
  const copy = translations[selected] || translations.en;

  const handleContinue = async () => {
    await setLanguage(selected);
    if (!onNavigate) return;
    onNavigate(fromSettings ? 'goBack' : 'intro');
  };

  return (
    <>
      <StatusBar backgroundColor="#F4F6FB" barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Hero */}
        <View style={styles.hero}>
          {fromSettings && (
            <TouchableOpacity
              onPress={() => onNavigate && onNavigate('goBack')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{copy.chooseLanguage}</Text>
          <Text style={styles.subtitle}>{copy.chooseLanguageSub}</Text>
        </View>

        {/* Languages */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map(l => {
            const isSelected = selected === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                activeOpacity={0.85}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {l.badge}
                  </Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.native}>{l.native}</Text>
                  <Text style={styles.label}>
                    {l.label} · {l.hello}
                  </Text>
                </View>
                <View style={[styles.check, isSelected && styles.checkSelected]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Continue */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.buttonText}>{fromSettings ? copy.save : copy.continue}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },

  hero: {
    backgroundColor: '#F4F6FB',
    alignItems: 'flex-start',
    paddingHorizontal: wp('7%'),
    paddingTop: hp('2.5%'),
    paddingBottom: hp('2%'),
  },
  backButton: {
    // In normal flow, above the title, so it can never overlap the text.
    alignSelf: 'flex-start',
    marginBottom: hp('1.5%'),
    marginLeft: -4,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 30,
    color: Colors.primary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 34,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#17243A', textAlign: 'left' },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'left',
    marginTop: 8,
  },

  list: { flex: 1 },
  listContent: { paddingHorizontal: wp('6%'), paddingTop: hp('1.5%'), paddingBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: { borderColor: Colors.secondary, backgroundColor: '#F3F6FF' },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: Colors.secondary },
  badgeText: { fontSize: 18, fontWeight: '700', color: '#475569', includeFontPadding: false },
  badgeTextSelected: { color: '#FFFFFF' },
  cardText: { flex: 1, marginHorizontal: 12 },
  native: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  label: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', includeFontPadding: false },

  footer: { paddingHorizontal: wp('6%'), paddingVertical: hp('1.5%') },
  button: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
