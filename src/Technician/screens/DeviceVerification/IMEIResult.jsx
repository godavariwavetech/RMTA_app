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
} from '../../../utils/responsive';

import { Colors } from '../../../Constants/Colors';

export default function IMEIResult({ onNavigate, imeiNumber }) {
  const [isCheckingCEIR, setIsCheckingCEIR] = useState(false);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleCheckCEIRStatus = () => {
    setIsCheckingCEIR(true);

    // Simulate API call
    setTimeout(() => {
      setIsCheckingCEIR(false);
      // Navigate to CEIR Result screen with the IMEI number
      onNavigate('ceirResult', { imeiNumber });
    }, 1500);
  };

  // Mock device data based on IMEI
  const deviceData = {
    brand: 'OnePlus',
    model: '9R',
    imei: imeiNumber || '356789123456789',
    format: '15 digits · Valid',
    storage: '128 GB',
    color: 'Lake Blue',
    status: 'verified',
    deviceImage: require('../../../Assets/images/sampleMobileImg.png'),
  };

  // Mock IMEI details
  const imeiDetails = [
    { label: 'IMEI', value: deviceData.imei },
    { label: 'Brand', value: deviceData.brand },
    { label: 'Model', value: deviceData.model },
    { label: 'Format', value: deviceData.format },
  ];

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
          <Text style={styles.headerTitle}>IMEI Result</Text>
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
              <Text style={styles.alertTitle}>IMEI verified</Text>
              <Text style={styles.alertSubtitle}>The IMEI format is valid</Text>
            </View>
          </View>

          {/* Device Card */}
          <View style={styles.deviceCard}>
            <View style={styles.deviceImageContainer}>
              <Image
                source={deviceData.deviceImage}
                style={styles.deviceImage}
              />
            </View>

            <View style={styles.deviceInfo}>
              <Text style={styles.deviceBrand}>{deviceData.brand}</Text>
              <Text style={styles.deviceModel}>{deviceData.model}</Text>
              <View style={styles.deviceDetails}>
                <Text style={styles.deviceStorage}>{deviceData.storage} · {deviceData.color}</Text>
                <Text style={styles.deviceImei}>IMEI {deviceData.imei}</Text>
              </View>
            </View>
          </View>

          {/* IMEI Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>IMEI details</Text>

            <View style={styles.detailsCard}>
              {imeiDetails.map((item, index) => (
                <View key={index}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                  {index < imeiDetails.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Information Card */}
          {/* <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoSymbol}>ℹ️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Device Information</Text>
              <Text style={styles.infoText}>
                This device information is based on the IMEI number. Verify CEIR status to check for blacklisted or reported devices.
              </Text>
            </View>
          </View> */}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Check CEIR Status Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.checkCEIRButton,
              isCheckingCEIR && styles.checkCEIRButtonDisabled
            ]}
            onPress={handleCheckCEIRStatus}
            disabled={isCheckingCEIR}
          >
            <Text style={styles.checkCEIRButtonText}>
              {isCheckingCEIR ? 'Checking CEIR...' : 'Check CEIR status'}
            </Text>
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
    marginHorizontal: wp('4%'),
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

  /* Device Card */
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('2.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceImageContainer: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceImage: {
    width: wp('24%'),
    height: wp('24%'),
    resizeMode: 'contain',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceBrand: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.2%'),
  },
  deviceModel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: hp('0.5%'),
  },
  deviceDetails: {
    gap: hp('0.3%'),
  },
  deviceStorage: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    fontWeight: '400',
  },
  deviceImei: {
    fontSize: wp('2.6%'),
    color: '#D1D5DB',
    fontWeight: '400',
  },

  /* Details Section */
  detailsSection: {
    marginHorizontal: wp('4%'),
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: '#1F2937',
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
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#6B7280',
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
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoIcon: {
    marginTop: hp('0.2%'),
  },
  infoSymbol: {
    fontSize: wp('5%'),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: hp('0.3%'),
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
  checkCEIRButton: {
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
  checkCEIRButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkCEIRButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
