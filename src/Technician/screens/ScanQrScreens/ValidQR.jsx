import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';

export default function ValidQR({ onNavigate, scannedCode }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('goBack')} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan result</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.resultBadge}><Text style={styles.badgeText}>CODE SCANNED</Text></View>
        <Text style={styles.title}>Code captured</Text>
        <Text style={styles.subtitle}>Review the scanned value below. Membership details have not been verified.</Text>
        <View style={styles.codeCard}><Text selectable style={styles.code}>{scannedCode || 'No code was returned by the scanner.'}</Text></View>
        <Text style={styles.note}>Only use this value for verification after connecting it to the RMTA membership verification service.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate?.('goBack')}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate?.('scanQR')}>
          <Text style={styles.secondaryButtonText}>Scan another code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { minHeight: hp('7%'), paddingHorizontal: wp('4%'), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  backButton: { width: wp('10%'), height: wp('10%'), alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.primary, fontSize: wp('8%') },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.primary, fontSize: wp('4.4%'), fontWeight: '700' },
  spacer: { width: wp('10%') },
  content: { padding: wp('5%'), flexGrow: 1, justifyContent: 'center' },
  resultBadge: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', paddingHorizontal: wp('3%'), paddingVertical: hp('0.7%'), borderRadius: wp('5%') },
  badgeText: { color: '#1D4ED8', fontSize: wp('3%'), fontWeight: '700', letterSpacing: 0.4 },
  title: { marginTop: hp('2%'), color: '#111827', fontSize: wp('6%'), fontWeight: '700' },
  subtitle: { marginTop: hp('0.8%'), color: '#64748B', fontSize: wp('3.7%'), lineHeight: wp('5.3%') },
  codeCard: { marginTop: hp('2.5%'), backgroundColor: '#fff', borderRadius: wp('3%'), borderWidth: 1, borderColor: '#E2E8F0', padding: wp('4%'), minHeight: hp('13%'), justifyContent: 'center' },
  code: { color: '#1F2937', fontSize: wp('4%'), lineHeight: wp('5.5%') },
  note: { marginTop: hp('1.5%'), color: '#64748B', fontSize: wp('3.2%'), lineHeight: wp('4.5%') },
  footer: { padding: wp('4%'), gap: hp('1%'), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  primaryButton: { borderRadius: wp('3%'), paddingVertical: hp('1.8%'), alignItems: 'center', backgroundColor: Colors.primary },
  primaryButtonText: { color: '#fff', fontSize: wp('4%'), fontWeight: '700' },
  secondaryButton: { borderRadius: wp('3%'), paddingVertical: hp('1.6%'), alignItems: 'center', backgroundColor: '#EFF6FF' },
  secondaryButtonText: { color: Colors.primary, fontSize: wp('3.8%'), fontWeight: '600' },
});
