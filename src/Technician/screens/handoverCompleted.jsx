import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';

export default function HandoverCompleted({ onNavigate }) {
  const activeJob = useSelector(state => state.jobSheet.activeJob) || {};
  const jobCode = activeJob.job_code || '—';
  const customerName = activeJob.customer_name || '—';
  const amountPaid =
    (activeJob.repairProgress && activeJob.repairProgress.finalCost) || '—';

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('replaceStack', { target: 'jobs' });
    }
  };

  const handleBackToJobSheets = () => {
    if (onNavigate) {
      onNavigate('replaceStack', { target: 'jobs' });
    }
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
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Handover Completed</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Success Card */}
            <View style={styles.successCard}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Device handed over</Text>
              <Text style={styles.successDescription}>
                {jobCode} is complete. The handover was confirmed by customer OTP.
              </Text>
            </View>

            {/* Record Saved Notice */}
            <View style={styles.recordSavedNotice}>
              <Image
                source={require('../../Assets/icons/shieldTick.png')}
                style={styles.savedIcon}
              />
              <View style={styles.savedTextContainer}>
                <Text style={styles.recordSavedTitle}>Record saved</Text>
                <Text style={styles.recordSavedDescription}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Receipt Section */}
            <View style={styles.receiptSection}>
              <Text style={styles.receiptTitle}>Receipt</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Customer</Text>
                <Text style={styles.receiptValue}>{customerName}</Text>
              </View>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount paid</Text>
                <Text style={styles.receiptValue}>{amountPaid}</Text>
              </View>
              <View style={styles.receiptDivider} />
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={styles.receiptValueGreen}>Completed</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Back to Job Sheets Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backToJobsButton}
            onPress={handleBackToJobSheets}
          >
            <Text style={styles.backToJobsButtonText}>Back to job sheets</Text>
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
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('0%'),
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkmarkContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F5DDC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  recordSavedNotice: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  savedIcon: {
    height: hp('3%'),
    width: wp('5%'),
    marginTop: 2,
    tintColor: '#059669'
  },
  savedTextContainer: {
    flex: 1,
  },
  recordSavedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  recordSavedDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  receiptSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  receiptValueGreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backToJobsButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToJobsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
