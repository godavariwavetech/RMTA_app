import React, { useState } from 'react';
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

export default function CEIRResult({ onNavigate, imeiNumber }) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleDone = () => {
    // Navigate back to home or previous screen
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Mock CEIR verification data
  const ceirData = {
    status: 'not_blocked',
    imei: imeiNumber || '356789123456789',
    blockStatus: 'Not blocked',
    checkedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    message: 'Sample result · Device not blocked',
  };

  const getStatusColor = () => {
    return ceirData.status === 'not_blocked' ? '#DCFCE7' : '#FEE2E2';
  };

  const getStatusIcon = () => {
    return ceirData.status === 'not_blocked'
      ? require('../../../Assets/icons/shieldTick.png')
      : require('../../../Assets/icons/invalid.png');
  };

  const getStatusTitle = () => {
    return ceirData.status === 'not_blocked' ? 'CEIR verified' : 'CEIR Failed';
  };

  const getStatusTitleColor = () => {
    return ceirData.status === 'not_blocked' ? '#047857' : '#DC2626';
  };

  const getStatusSubtitleColor = () => {
    return ceirData.status === 'not_blocked' ? '#059669' : '#991B1B';
  };

  const getBlockStatusColor = () => {
    return ceirData.status === 'not_blocked' ? '#10B981' : '#DC2626';
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
          <Text style={styles.headerTitle}>CEIR Result</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Status Alert */}
          <View style={[styles.statusAlert, { backgroundColor: getStatusColor() }]}>
            <Image
              source={getStatusIcon()}
              style={[
                styles.statusIcon,
                {
                  tintColor: ceirData.status === 'not_blocked' ? '#10B981' : '#DC2626',
                },
              ]}
            />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: getStatusTitleColor() }]}>
                {getStatusTitle()}
              </Text>
              <Text style={[styles.alertSubtitle, { color: getStatusSubtitleColor() }]}>
                {ceirData.message}
              </Text>
            </View>
          </View>

          {/* Device Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Device status</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IMEI</Text>
                <Text style={styles.detailValue}>{ceirData.imei}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: getBlockStatusColor() }]}>
                  {ceirData.blockStatus}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Checked on</Text>
                <Text style={styles.detailValue}>{ceirData.checkedDate}</Text>
              </View>
            </View>
          </View>

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Image
                source={require('../../../Assets/icons/shieldTick.png')}
                style={[
                  styles.infoIcon,
                  { tintColor: '#3B82F6' },
                ]}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                Sample verification result. Production checks require the appropriate service integration.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Done Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: hp('2%'),
  },

  /* Header */
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: hp('2%'),
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
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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

  /* Status Alert */
  statusAlert: {
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginBottom: hp('2%'),
    marginHorizontal: wp('4%'),
    // borderLeftWidth: 4,
    // borderLeftColor: '#10B981',
  },
  statusIcon: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },
  alertSubtitle: {
    fontSize: wp('2.6%'),
    fontWeight: '400',
    marginTop: hp('0.3%'),
  },

  /* Device Status Card */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('2.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  detailsContainer: {
    gap: hp('0.5%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  detailLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: wp('2%'),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  /* Info Card */
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    // borderLeftWidth: 3,
    // borderLeftColor: '#3B82F6',
  },
  infoIconContainer: {
    marginTop: hp('0.2%'),
  },
  infoIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: wp('2.8%'),
    color: '#3B82F6',
    fontWeight: '400',
    lineHeight: hp('1.8%'),
  },

  /* Footer */
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('2%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
