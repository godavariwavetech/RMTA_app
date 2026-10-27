import React from 'react';
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

export default function ValidQR({ onNavigate }) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleViewMemberDetails = () => {
    if (onNavigate) {
      onNavigate('memberDetails');
    }
  };

  // Mock QR verified data
  const verifiedData = {
    name: 'Ramesh Kumar',
    memberId: 'RMTA-240-1025',
    organization: 'Ramesh Mobile Care',
    location: 'Warangal, Telangana',
    validUntil: '31 Dec 2027',
    status: 'Active',
    membershipStatus: 'Active',
    profileBadge: require('../../../Assets/images/appLogo.png'),
    membershipIcon: require('../../../Assets/icons/shieldTick.png'),
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
            <Text style={styles.headerTitle}>QR Verified</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >


          {/* Success Alert */}
          <View style={styles.successAlert}>
            <Image
              source={require('../../../Assets/icons/circle-check.png')}
              style={styles.successIcon}
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>QR verified</Text>
              <Text style={styles.alertSubtitle}>Valid RMTA member QR code confirmed</Text>
            </View>
          </View>

          {/* Digital ID Card */}
          <View style={styles.idCardContainer}>
            <View style={styles.digitalIdCard}>
              {/* Card Header - Logo and Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.logoSection}>
                  <Image
                    source={verifiedData.profileBadge}
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
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>

              {/* Card Body - Member Info */}
              <View style={styles.cardBody}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{verifiedData.name}</Text>
                  <Text style={styles.memberId}>{verifiedData.memberId}</Text>
                  <Text style={styles.organization}>{verifiedData.organization}</Text>
                  <View style={styles.locationRow}>
                    <Text style={styles.location}>
                      {verifiedData.location} · Valid till {verifiedData.validUntil}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Verification Details */}
          <View style={styles.verificationDetailsSection}>
            <Text style={styles.sectionTitle}>Verification details</Text>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Member ID</Text>
                <Text style={styles.detailValue}>{verifiedData.memberId}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Membership</Text>
                <Text style={styles.detailValue}>{verifiedData.membershipStatus}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valid till</Text>
                <Text style={styles.detailValue}>{verifiedData.validUntil}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verification Time</Text>
                <Text style={styles.detailValue}>10:45 AM, Today</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scan Method</Text>
                <Text style={styles.detailValue}>QR Code</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewMemberDetails}
          >
            <Text style={styles.primaryButtonText}>View member details</Text>
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
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d4ff',
    marginBottom: hp('4%'),
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: wp('8%'),
    fontWeight: '300',
  },
  headerTitle: {
    color: Colors.primary,
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
    paddingVertical: hp('2%'),
    paddingBottom: hp('3%'),
  },

  /* Success Alert */
  successAlert: {
    backgroundColor: '#DCFCE7',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginBottom: hp('2%'),
    marginHorizontal: wp('4%')
  },
  successIcon: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
    tintColor: '#10B981',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#047857',
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },
  alertSubtitle: {
    color: '#059669',
    fontSize: wp('2.6%'),
    fontWeight: '400',
    marginTop: hp('0.3%'),
  },

  /* Digital ID Card */
  idCardContainer: {
    marginBottom: hp('2.5%'),
    marginHorizontal: wp('4%')
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

  /* Verification Details */
  verificationDetailsSection: {
    marginTop: hp('1%'),
    marginHorizontal: wp('4%')
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: wp('3.6%'),
    fontWeight: '700',
    marginBottom: hp('1.2%'),
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
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: wp('2%'),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  /* Footer */
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
