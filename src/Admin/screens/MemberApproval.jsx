import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { Colors } from '../../Constants/Colors';

export default function MemberApproval({ onNavigate }) {
  const [businessDetailsChecked, setBusinessDetailsChecked] = useState(true);
  const [identityChecked, setIdentityChecked] = useState(true);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleRequestMoreInfo = () => {
    console.log('Request more information clicked');
  };

  const handleApproveMembership = () => {
    if (onNavigate) {
      onNavigate('technicianDetails');
    }
  };

  // Sample applicant data
  const applicantData = {
    name: 'Ramesh Kumar',
    shop: 'Ramesh Mobile Care',
    mobile: '+91 98765 43210',
    location: 'Warangal, Telangana',
  };

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
            <Text style={styles.headerTitle}>Member Approval</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Review application</Text>
            <Text style={styles.subtitle}>
              Check the member's details before approving.
            </Text>
          </View>

          {/* Applicant Details Section */}
          <View style={styles.applicantSection}>
            <Text style={styles.sectionTitle}>Applicant</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{applicantData.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shop</Text>
                <Text style={styles.detailValue}>{applicantData.shop}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{applicantData.mobile}</Text>
              </View>

              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{applicantData.location}</Text>
              </View>
            </View>
          </View>

          {/* Verification Checklist */}
          <View style={styles.checklistSection}>
            <TouchableOpacity
              style={styles.checklistItem}
              onPress={() => setBusinessDetailsChecked(!businessDetailsChecked)}
            >
              <View
                style={[
                  styles.checkbox,
                  businessDetailsChecked && styles.checkboxChecked,
                ]}
              >
                {businessDetailsChecked && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checklistText}>Business details reviewed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checklistItem}
              onPress={() => setIdentityChecked(!identityChecked)}
            >
              <View
                style={[
                  styles.checkbox,
                  identityChecked && styles.checkboxChecked,
                ]}
              >
                {identityChecked && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checklistText}>
                Identity checked with consent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Request More Info Button */}
          <View style={styles.requestSection}>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={handleRequestMoreInfo}
            >
              <Text style={styles.requestButtonText}>
                Request more information
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Approve Membership Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={handleApproveMembership}
          >
            <Text style={styles.approveButtonText}>Approve membership</Text>
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
    // color: Colors.secondary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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

  /* Title Section */
  titleSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  mainTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#6B7280',
  },

  /* Applicant Section */
  applicantSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: wp('3%'),
    fontWeight: '500',
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Checklist Section */
  checklistSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    gap: wp('3%'),
  },
  checkbox: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('1.5%'),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5B8DEE',
    borderColor: '#5B8DEE',
  },
  checkmark: {
    fontSize: wp('4%'),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checklistText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },

  /* Request Section */
  requestSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  requestButton: {
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
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
  approveButton: {
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
  approveButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
