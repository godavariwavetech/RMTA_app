import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../Constants/Colors';

const capitalize = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function TechnicianDetails({ onNavigate, technician }) {
  // Reveal toggle for the password shown on the card (masked by default).
  const [showPassword, setShowPassword] = useState(false);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleReviewMember = () => {
    if (onNavigate) {
      onNavigate('memberApproval');
    }
  };

  // Build the view model from the technician passed in by TechnicianList
  // (a row from /public_app/technicians_list). Guard against a direct nav with
  // no param, and fall back gracefully for fields the API doesn't provide yet.
  const t = technician || {};
  const location = [t.city, t.state].filter(Boolean).join(', ');
  const technicianData = {
    name: t.full_name || 'Unnamed',
    rmtaId: t.member_code || '—',
    shop: t.shop_name || '—',
    location: location || '—',
    mobile: t.mobile || '—',
    // Decrypted password from the API. Older technicians have none → null.
    password: t.password || null,
    status: capitalize(t.technician_status) || 'Active',
    memberType: 'TECHNICIAN MEMBER',
    openJobs: t.open_jobs || 0,
    completedJobs: t.completed_jobs || 0,
    membership: capitalize(t.membership_status) || '—',
  };

  // Always show dots + eye. Revealing shows the real password, or a short note
  // for technicians added before the password was stored in a viewable form.
  const passwordDisplay = showPassword
    ? technicianData.password || 'Not available'
    : '••••••••';

  return (
    <>
      <StatusBar
        backgroundColor="#F5F5F5"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Technician Details</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Technician Card */}
          <View style={styles.cardContainer}>
            <ImageBackground
              source={require('../../Assets/images/LoginBgImg.png')}
              style={styles.cardContent}
              resizeMode="cover"
            >
              <View style={styles.cardOverlay} />

              {/* Card Content */}
              <View style={styles.cardTextContainer}>
                {/* Top Section - RMTA Logo and Status Badge */}
                <View style={styles.cardTopSection}>
                  <View>
                    <Text style={styles.rmtaLogo}>RMTA</Text>
                    <Text style={styles.memberType}>{technicianData.memberType}</Text>
                  </View>
                  <View style={styles.statusBadgeContainer}>
                    <Text style={styles.statusBadge}>{technicianData.status}</Text>
                  </View>
                </View>

                {/* Technician Info */}
                <View style={styles.techInfoSection}>
                  <Text style={styles.techName}>{technicianData.name}</Text>
                  <Text style={styles.techId}>{technicianData.rmtaId}</Text>
                  <Text style={styles.techShop}>{technicianData.shop}</Text>
                  <Text style={styles.techLocation}>{technicianData.location}</Text>
                  <Text style={styles.techLocation}>📞 {technicianData.mobile}</Text>

                  {/* Password — masked, with an eye toggle to show/hide. */}
                  <View style={styles.passwordRow}>
                    <Text style={styles.techPassword}>🔒 {passwordDisplay}</Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.cardEyeIcon}
                    >
                      <Image
                        source={
                          showPassword
                            ? require('../../Assets/icons/eyeOpen.png')
                            : require('../../Assets/icons/eyeClose.png')
                        }
                        style={styles.cardEyeIconImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Member Activity Section */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Member activity</Text>

            <View style={styles.activityItems}>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Open jobs</Text>
                <Text style={styles.activityValue}>{technicianData.openJobs}</Text>
              </View>

              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Completed jobs</Text>
                <Text style={styles.activityValue}>{technicianData.completedJobs}</Text>
              </View>

              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Membership</Text>
                <Text style={[styles.activityValue, styles.membershipText]}>
                  {technicianData.membership}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Access Section */}
          <View style={styles.accessSection}>
            <View style={styles.accessIconContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
            <View style={styles.accessContent}>
              <Text style={styles.accessTitle}>Account access</Text>
              <Text style={styles.accessSubtitle}>Lock or unlock technician login</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Review Member Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReviewMember}
          >
            <Text style={styles.reviewButtonText}>Review member</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: wp('8%'),
  },

  /* Technician Card */
  cardContainer: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardContent: {
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('4%'),
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  cardOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(7, 26, 61, 0.7)',
  },
  cardTextContainer: {
    zIndex: 1,
    width: '100%',
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
  },
  rmtaLogo: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('0.3%'),
  },
  memberType: {
    fontSize: wp('2.2%'),
    fontWeight: '600',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  statusBadgeContainer: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('3%'),
  },
  statusBadge: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: Colors.primary,
  },

  /* Technician Info */
  techInfoSection: {
    marginTop: hp('1%'),
  },
  techName: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('0.3%'),
  },
  techId: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: hp('0.5%'),
  },
  techShop: {
    fontSize: wp('3.2%'),
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: hp('0.3%'),
  },
  techLocation: {
    fontSize: wp('2.8%'),
    fontWeight: '400',
    color: '#D1D5DB',
    marginBottom: hp('0.3%'),
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  techPassword: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardEyeIcon: {
    padding: wp('1.5%'),
    marginLeft: wp('2%'),
  },
  cardEyeIconImage: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    tintColor: '#FCD34D',
  },

  /* Activity Section */
  activitySection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  activityItems: {
    gap: hp('1%'),
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  activityValue: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
  },
  membershipText: {
    color: Colors.secondary,
  },

  /* Account Access Section */
  accessSection: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  accessIconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  lockIcon: {
    fontSize: wp('6%'),
  },
  accessContent: {
    flex: 1,
  },
  accessTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  accessSubtitle: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#6B7280',
  },

  /* Bottom Spacer */
  bottomSpacer: {
    height: hp('2%'),
  },

  /* Button Container */
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  reviewButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  reviewButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
