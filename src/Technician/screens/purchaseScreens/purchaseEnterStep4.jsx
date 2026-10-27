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

import { useDispatch } from 'react-redux';
import { updatePurchaseDraft } from '../../../redux/slices/purchaseSlice';

export default function PurchaseEnterStep4({ onNavigate, sellerData, deviceData, imeiData }) {
  const dispatch = useDispatch();
  const handleContinue = () => {
    console.log('[Purchase][Step4] CEIR verified → true');
    dispatch(updatePurchaseDraft({ ceirVerified: true }));
    if (onNavigate) {
      onNavigate('purchaseEntryStep5', {
        sellerData: sellerData,
        deviceData: deviceData,
        imeiData: imeiData,
        ceirVerified: true,
      });
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 4;

  // Prepare device display info
  const deviceBrand = deviceData?.deviceBrand || 'Device';
  const deviceModel = deviceData?.deviceModel || '';
  const storage = deviceData?.storage || '';
  const color = deviceData?.color || '';
  const imei = imeiData?.imei || '';

  // Show the photo captured in step 2 (its local uri is still valid in-session);
  // fall back to the sample image if no photo was taken.
  const devicePhotoUri = deviceData?.devicePhoto?.uri || null;
  const deviceImageSource = devicePhotoUri
    ? { uri: devicePhotoUri }
    : require('../../../Assets/images/sampleMobileImg.png');

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
            <Text style={styles.headerTitle}>CEIR Verification</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 8 · CEIR</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Check device status</Text>
            <Text style={styles.sectionDescription}>
              Confirm the device is eligible for purchase.
            </Text>

            {/* Device Card */}
            <View style={styles.deviceCard}>
              <Image
                source={deviceImageSource}
                style={styles.deviceImage}
              />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{deviceBrand} {deviceModel}</Text>
                <Text style={styles.deviceDetails}>
                  {storage}
                  {storage && color ? ' · ' : ''}
                  {color}
                </Text>
                <Text style={styles.deviceImei}>IMEI {imei}</Text>
              </View>
            </View>

            {/* IMEI Verified Status */}
            <View style={styles.statusContainer}>
              <Image
                source={require('../../../Assets/icons/circle-check.png')}
                style={styles.statusIcon}
              />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>IMEI verified</Text>
                <Text style={styles.statusSubtitle}>Valid 15-digit format</Text>
              </View>
            </View>

            {/* CEIR Verified Status */}
            <View style={styles.statusContainer}>
              <Image
                source={require('../../../Assets/icons/circle-check.png')}
                style={styles.statusIcon}
              />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>CEIR verified</Text>
                <Text style={styles.statusSubtitle}>Demo result · No block reported</Text>
              </View>
            </View>

            {/* Info Notice */}
            <View style={styles.noticeContainer}>
              <Image
                source={require('../../../Assets/icons/shieldTick.png')}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                Recheck official device status before completing a real transaction.
              </Text>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
  stepIndicator: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F5DDC',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp('5%'),
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: hp('2%'),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F5DDC',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 16,
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceImage: {
    width: wp('26%'),
    height: hp('7%'),
    resizeMode: 'contain',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: wp('3%'),
    color: '#6B7280',
    marginBottom: 4,
  },
  deviceImei: {
    fontSize: wp('3%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#EAF8EF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: hp('2%'),
  },
  statusIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginTop: 0,
    tintColor: '#21884cff',
  },
  statusContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#21884cff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: wp('3%'),
    color: '#6B7280',
    fontWeight: '400',
  },
  noticeContainer: {
    backgroundColor: '#EAF1FF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: hp('2%'),
  },
  noticeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginTop: 2,
  },
  noticeText: {
    fontSize: wp('3%'),
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
