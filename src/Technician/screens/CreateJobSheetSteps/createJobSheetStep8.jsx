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

export default function CreateJobSheetStep8({ onNavigate, job }) {
  const j = job || {};
  const jobCode = j.job_code || '—';
  const deviceName =
    [j.device_brand, j.device_model].filter(Boolean).join(' ') || 'Device';
  const customerName = j.customer_name || '';
  const jobInfo = [j.customer_name, j.problem_description].filter(Boolean).join(' · ');
  const price =
    j.estimated_cost != null
      ? `₹${Number(j.estimated_cost).toLocaleString('en-IN')}`
      : '';

  const handleBackPress = () => {
    // Job is already created — go back to the jobs list, not the review step.
    if (onNavigate) {
      onNavigate('jobs');
    }
  };

  const handleViewJobDetails = () => {
    // Pass the created job's id so the details screen can fetch it.
    if (onNavigate) {
      onNavigate('jobDetails', { jobId: j.job_id });
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
            <Text style={styles.headerTitle}>Job Created</Text>
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
              <Text style={styles.successTitle}>Job sheet created</Text>
              <Text style={styles.successMessage}>
                {jobCode} is ready. Your customer has been notified.
              </Text>
            </View>

            {/* Record Saved Notice */}
            <View style={styles.noticeContainer}>
              <View style={styles.noticeIconContainer}>
                <Image
                  source={require('../../../Assets/icons/shieldTick.png')}
                  style={styles.noticeIcon}
                />
              </View>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Record saved</Text>
                <Text style={styles.noticeSubtitle}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Job Details Card */}
            <View style={styles.jobDetailsCard}>
              <Text style={styles.jobId}>{jobCode}</Text>
              <Text style={styles.deviceName}>{deviceName}</Text>
              <Text style={styles.jobInfo}>{jobInfo || customerName}</Text>
              <View style={styles.jobFooter}>
                <Text style={styles.price}>{price}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* View Job Details Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewJobDetails}>
            <Text style={styles.viewDetailsButtonText}>View job details</Text>
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
    // backgroundColor: '#FFFFFF',
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
    // width: 44,
    // height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%')
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
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
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2F5DDC',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeContainer: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  noticeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  noticeIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 2,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: '#8f8f8fff',
    lineHeight: 16,
  },
  jobDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobId: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobInfo: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  bottomSpacer: {
    height: 24,
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewDetailsButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
