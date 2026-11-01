import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../utils/responsive';
import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import MemberIdentityCard from '../../../Components/MemberIdentityCard';
import { SkeletonDetails } from '../../../Components/Skeleton';

// Picks the member record out of the response, whichever way it is wrapped:
// { data: {…} }, { data: [{…}] }, { member: {…} } or the object itself.
const extractMember = data => {
  if (!data || typeof data !== 'object') return null;
  const candidate = data.data !== undefined ? data.data : data.member !== undefined ? data.member : data;
  const record = Array.isArray(candidate) ? candidate[0] : candidate;
  if (!record || typeof record !== 'object') return null;
  // Ignore bare status wrappers such as { status: 200, message: '' }.
  const hasDetails = Object.keys(record).some(
    k => !['status', 'success', 'message', 'msg'].includes(k),
  );
  return hasDetails ? record : null;
};

// A member is active unless the record explicitly says otherwise
// (membership_status / account_status of 0, '0' or 'inactive').
const isActiveMember = record => {
  const raw = [record.membership_status, record.account_status, record.status].find(
    v => v !== undefined && v !== null && String(v).trim() !== '',
  );
  if (raw === undefined) return true;
  const v = String(raw).toLowerCase();
  return v === '1' || v === 'active' || v === 'true';
};

// Result of a scan: sends the scanned text to getqrdata and shows the member it
// belongs to, as an identity card.
export default function ValidQR({ onNavigate, scannedCode }) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);

  const lookUp = useCallback(async () => {
    setLoading(true);
    setMember(null);
    console.log('[QR scan] scanned text →', scannedCode);
    try {
      const { response, data } = await postJson(ENDPOINTS.GET_QR_DATA, { qr_data: scannedCode });
      console.log('[QR scan] getqrdata response →', response.status, JSON.stringify(data));
      const record = response.ok && !(data && data.success === false) ? extractMember(data) : null;
      // No member in the response → treated as not an active member.
      setMember(record);
    } catch (err) {
      console.log('[QR scan] getqrdata error →', err.message);
    } finally {
      setLoading(false);
    }
  }, [scannedCode]);

  useEffect(() => {
    lookUp();
  }, [lookUp]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('goBack')} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SkeletonDetails rows={7} />
        ) : member && isActiveMember(member) ? (
          <View>
            <View style={[styles.statusBadge, styles.statusActive]}>
              <Text style={[styles.statusText, styles.statusActiveText]}>✓  Active member</Text>
            </View>
            <MemberIdentityCard member={member} />
          </View>
        ) : (
          <View style={styles.notActiveBox}>
            <View style={styles.notActiveIcon}>
              <Text style={styles.notActiveIconText}>✕</Text>
            </View>
            <Text style={styles.notActiveTitle}>Not an active member</Text>
            <Text style={styles.notActiveText}>
              This QR code does not belong to an active RMTA member.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={lookUp}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Done leaves the scan flow for the home screen. */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onNavigate?.('goBackTo', { target: 'home' })}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
        {/* Scan another goes back to the scanner (the scanner is already in the
            history, so this does not add another entry on top of it). */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate?.('goBack')}>
          <Text style={styles.secondaryButtonText}>Scan another code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  header: { minHeight: hp('7%'), paddingHorizontal: wp('4%'), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  backButton: { width: wp('10%'), height: wp('10%'), alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.primary, fontSize: wp('8%'), includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.primary, fontSize: wp('4.4%'), fontWeight: '700' },
  spacer: { width: wp('10%') },
  content: { padding: wp('4%'), flexGrow: 1 },
  statusBadge: { alignSelf: 'center', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 22, marginTop: hp('1%') },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: wp('3.8%'), fontWeight: '800' },
  statusActiveText: { color: '#15803D' },
  notActiveBox: { alignItems: 'center', paddingTop: hp('8%'), paddingHorizontal: wp('6%') },
  notActiveIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  notActiveIconText: { fontSize: 38, color: '#DC2626', fontWeight: '700', includeFontPadding: false },
  notActiveTitle: { marginTop: hp('2.5%'), fontSize: wp('6%'), fontWeight: '800', color: '#B91C1C', textAlign: 'center' },
  notActiveText: { marginTop: hp('1%'), fontSize: wp('3.8%'), color: '#64748B', textAlign: 'center', lineHeight: wp('5.4%') },
  retryButton: { marginTop: hp('3%'), alignSelf: 'center', borderRadius: wp('3%'), backgroundColor: Colors.primary, paddingHorizontal: wp('6%'), paddingVertical: hp('1.4%') },
  retryText: { color: '#fff', fontWeight: '700', fontSize: wp('3.8%') },
  footer: { padding: wp('4%'), gap: hp('1%'), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  primaryButton: { borderRadius: wp('3%'), paddingVertical: hp('1.8%'), alignItems: 'center', backgroundColor: Colors.primary },
  primaryButtonText: { color: '#fff', fontSize: wp('4%'), fontWeight: '700' },
  secondaryButton: { borderRadius: wp('3%'), paddingVertical: hp('1.6%'), alignItems: 'center', backgroundColor: '#EFF6FF' },
  secondaryButtonText: { color: Colors.primary, fontSize: wp('3.8%'), fontWeight: '600' },
});
