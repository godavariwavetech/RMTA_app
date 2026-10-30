import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../../Constants/Colors';
import { BASE_URL } from '../../../Constants/config';
import useAccountProfile from '../../../utils/useAccountProfile';
import MemberIdentityCard from '../../../Components/MemberIdentityCard';

const imageUrl = path =>
  path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${String(path).replace(/^\//, '')}`) : null;

export default function MyDigitalId({ onNavigate }) {
  const profile = useAccountProfile();

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // The footer button opens the QR scanner.
  const handleScanQR = () => {
    if (onNavigate) {
      onNavigate('scanQR');
    }
  };

  // Prefer the freshly fetched profile, fall back to the cached login user.
  const d = profile || {};
  const fmtDate = v => {
    if (!v) return '—';
    const dt = new Date(v);
    return isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const statusRaw = d.membership_status || '';

  // The member's own QR image comes with the member_login data. Its field name
  // isn't documented, so a few likely names are tried. The value may be a full
  // URL, a server path, or base64; the built-in sample QR is the fallback.
  const QR_KEYS = ['qr_image', 'qr_code', 'qr_code_image', 'qrcode', 'qr_url', 'qr'];
  const qrKey = QR_KEYS.find(k => typeof d[k] === 'string' && d[k].trim() !== '');
  let qrSource = require('../../../Assets/images/qrCode.png');
  if (qrKey) {
    const raw = d[qrKey].trim();
    const uri = /^(https?:|data:)/.test(raw)
      ? raw
      : raw.length > 300
      ? `data:image/png;base64,${raw}`
      : imageUrl(raw);
    qrSource = { uri };
  }

  useEffect(() => {
    // Which login field supplied the QR image (value truncated).
    console.log(
      '[DigitalId] QR image →',
      qrKey ? `${qrKey}: ${String(d[qrKey]).slice(0, 80)}` : 'none in the login data, using the sample QR',
    );
  }, [qrKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const userData = {
    name: d.full_name || 'Technician',
    memberId: d.member_code || '—',
    organization: d.shop_name || '—',
    location: [d.city, d.state].filter(Boolean).join(', ') || '—',
    validUntil: fmtDate(d.valid_until),
    memberSince: fmtDate(d.member_since),
    phone: d.mobile || '—',
    status: cap(statusRaw) || '—',
    isActive: statusRaw === 'active',
    qrCode: qrSource,
    profileBadge: require('../../../Assets/images/appLogo.png'),
  };

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Digital ID</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Description Text */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>
              Always carry your membership
            </Text>
            <Text style={styles.descriptionText}>
              Show your member ID or use NFC and QR verification.
            </Text>

            {/* QR Code Section */}
            <View style={styles.qrCodeContainer}>
                <Image
                source={userData.qrCode}
                style={styles.qrImage}
                />
                <Text style={styles.memberId}>{userData.memberId}</Text>
            </View>
          </View>

          {/* Member identity card (from the member_login data) */}
          <MemberIdentityCard member={d} />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer - Primary Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleScanQR}
          >
            <Text style={styles.primaryButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    // backgroundColor: ,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6ff'
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#000',
    backgroundColor:'#fff',
    borderWidth: 1,
    borderColor: '#e6e6e6ff',
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('0%'),
    borderRadius: wp('2%')
  },
  backButtonText: {
    color: '#000',
    fontSize: wp('8%'),
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    color: '#000',
    fontSize: wp('4.2%'),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },

  /* Digital ID Card Styles */

  /* Card Body */
  memberId: {
    color: '#D1D5DB',
    fontSize: wp('2.8%'),
    fontWeight: '600',
    marginBottom: hp('0.3%'),
  },

  /* QR Code */
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:'#fff',
    paddingVertical: hp('3%'),
    marginTop: hp('3%'),
    borderWidth: 1,
    borderColor: '#e0e0e0ff',
    borderRadius: wp('3%'),
    gap: wp('3%')
  },
  qrImage: {
    width: wp('26%'),
    height: wp('26%'),
    resizeMode: 'contain',
    marginBottom: hp('0.5%'),
  },

  /* Description Container */
  descriptionContainer: {
    marginBottom: hp('2.5%'),
    marginTop: hp('1%'),
  },
  descriptionTitle: {
    color: '#1F2937',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    marginBottom: hp('0.5%'),
  },
  descriptionText: {
    color: '#6B7280',
    fontSize: wp('2.8%'),
    fontWeight: '400',
    lineHeight: wp('4%'),
  },

  /* Buttons */
  primaryButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  /* Full Details Section */

  /* Footer Styles */
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
