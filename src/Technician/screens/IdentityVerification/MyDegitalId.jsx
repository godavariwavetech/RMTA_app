import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';

export default function MyDigitalId({ onNavigate }) {
  const user = useSelector(state => state.auth.user) || {};
  const [profile, setProfile] = useState(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Fetch the full member profile (same source as the home screen).
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.user_id) return;
      try {
        const { response, data } = await postJson(ENDPOINTS.TECHNICIAN_DETAILS, {
          user_id: user.user_id,
        });
        if (active && response.ok && data && data.success !== false) {
          setProfile(data.data);
        }
      } catch (e) {
        // fall back to the cached login user
      }
    })();
    return () => {
      active = false;
    };
  }, [user.user_id]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleScanNFC = () => {
    if (onNavigate) {
      onNavigate('scanNFC');
    }
  };

  const handleViewFullDetails = () => {
    setShowFullDetails(!showFullDetails);
  };

  // Prefer the freshly fetched profile, fall back to the cached login user.
  const d = profile || user || {};
  const fmtDate = v => {
    if (!v) return '—';
    const dt = new Date(v);
    return isNaN(dt.getTime())
      ? '—'
      : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const statusRaw = d.membership_status || '';

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
    qrCode: require('../../../Assets/images/qrCode.png'),
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
          {/* Digital ID Card */}
          <View style={styles.idCardContainer}>
            {/* Card Background */}
            <View style={styles.digitalIdCard}>
              {/* Card Header - Logo and Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.logoSection}>
                  <Image
                    source={userData.profileBadge}
                    style={styles.cardLogo}
                  />
                  <View style={styles.logoText}>
                    <Text style={styles.rmtaText}>RMTA</Text>
                    <Text style={styles.memberText}>TECHNICIAN MEMBER</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>{userData.status}</Text>
                </View>
              </View>

              {/* Card Body - Member Info */}
              <View style={styles.cardBody}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{userData.name}</Text>
                  <Text style={styles.memberId}>{userData.memberId}</Text>
                  <Text style={styles.organization}>{userData.organization}</Text>
                  <View style={styles.locationRow}>
                    <Text style={styles.location}>
                      {userData.location} · Valid till {userData.validUntil}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

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

          {/* View Full Details Button */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewFullDetails}
          >
            <Text style={styles.secondaryButtonText}>View full details</Text>
          </TouchableOpacity>

          {/* Full Details Section - Expandable */}
          {showFullDetails && (
            <View style={styles.fullDetailsContainer}>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member Name</Text>
                  <Text style={styles.detailValue}>{userData.name}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member ID</Text>
                  <Text style={styles.detailValue}>{userData.memberId}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Organization</Text>
                  <Text style={styles.detailValue}>{userData.organization}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{userData.location}</Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: userData.isActive ? '#10B981' : '#9CA3AF' }]} />
                    <Text style={[styles.statusText, { color: userData.isActive ? '#10B981' : '#9CA3AF' }]}>
                      {userData.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valid Until</Text>
                  <Text style={styles.detailValue}>{userData.validUntil}</Text>
                </View>

                {/* Member Since */}
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>{userData.memberSince}</Text>
                </View>

                {/* Phone Number */}
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{userData.phone}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer - Primary Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleScanNFC}
          >
            <Text style={styles.primaryButtonText}>Scan an NFC Card</Text>
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
  idCardContainer: {
    marginBottom: hp('2%'),
  },
  digitalIdCard: {
    backgroundColor: Colors.primary,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  cardLogo: {
    width: wp('12%'),
    height: wp('12%'),
    resizeMode: 'contain',
  },
  logoText: {
    gap: 2,
  },
  rmtaText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
  memberText: {
    color: '#E5E7EB',
    fontSize: wp('2.4%'),
    fontWeight: '500',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('4%'),
    gap: wp('1.5%'),
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  activeText: {
    color: '#D97706',
    fontSize: wp('2.8%'),
    fontWeight: '600',
  },

  /* Card Body */
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: wp('3%'),
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '700',
    marginBottom: hp('0.5%'),
  },
  memberId: {
    color: '#D1D5DB',
    fontSize: wp('2.8%'),
    fontWeight: '600',
    marginBottom: hp('0.3%'),
  },
  organization: {
    color: '#E5E7EB',
    fontSize: wp('2.6%'),
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#B5C5DF',
    fontSize: wp('2.4%'),
    fontWeight: '400',
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
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  /* Full Details Section */
  fullDetailsContainer: {
    marginBottom: hp('2%'),
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: wp('3%'),
    fontWeight: '500',
  },
  detailValue: {
    color: '#1F2937',
    fontSize: wp('3%'),
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: wp('2%'),
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('0.5%'),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: wp('3%'),
    fontWeight: '600',
  },

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
