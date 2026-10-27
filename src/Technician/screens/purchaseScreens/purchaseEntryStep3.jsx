import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updatePurchaseDraft } from '../../../redux/slices/purchaseSlice';

export default function PurchaseEntryStep3({ onNavigate, sellerData, deviceData }) {
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so revisiting this step keeps what was entered.
  const draftImei = useSelector(state => state.purchase.draft.imei) || {};
  const [imei, setImei] = useState(draftImei.imei || '');
  const [imeiVerified, setImeiVerified] = useState(!!draftImei.verified);
  const [imeiStatus, setImeiStatus] = useState(
    draftImei.verified
      ? `Valid 15-digit format · ${deviceData?.deviceBrand || 'Device'} ${deviceData?.deviceModel || ''}`
      : '',
  );

  const handleScanIMEI = () => {
    // This will be connected to barcode/IMEI scanner
    console.log('Scan device IMEI clicked');
  };

  const handleImeiChange = (value) => {
    setImei(value);
    // Reset verification status when user changes IMEI
    if (imeiVerified) {
      setImeiVerified(false);
      setImeiStatus('');
    }
  };

  const handleVerifyIMEI = () => {
    // Basic IMEI validation (15 digits)
    if (imei.length === 15 && /^\d+$/.test(imei)) {
      setImeiVerified(true);
      // Mock status - in real app this would come from an API
      setImeiStatus(`Valid 15-digit format · ${deviceData?.deviceBrand || 'Device'} ${deviceData?.deviceModel || ''}`);
    }
  };

  const handleContinue = () => {
    const imeiData = { imei: imei, verified: imeiVerified };
    console.log('[Purchase][Step3] imei captured →', imeiData);
    dispatch(updatePurchaseDraft({ imei: imeiData }));
    if (onNavigate) {
      onNavigate('purchaseEnterStep4', {
        sellerData: sellerData,
        deviceData: deviceData,
        imeiData: imeiData,
      });
    }
  };

  const handleBackPress = () => {
    dispatch(updatePurchaseDraft({ imei: { imei: imei, verified: imeiVerified } }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 3;

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
            <Text style={styles.headerTitle}>IMEI Verification</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 8 · IMEI</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '37.5%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Check the IMEI</Text>
            <Text style={styles.sectionDescription}>
              Match this number with the device and its packaging.
            </Text>

            {/* IMEI Input Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                IMEI 1 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter or scan IMEI"
                placeholderTextColor="#9CA3AF"
                value={imei}
                onChangeText={handleImeiChange}
                keyboardType="numeric"
                maxLength={15}
              />
            </View>

            {/* Scan Button */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanIMEI}
            >
              <Text style={styles.scanButtonText}>Scan device IMEI</Text>
            </TouchableOpacity>

            {/* Verification Status */}
            {imeiVerified && (
              <View style={styles.statusContainer}>
                <Image
                  source={require('../../../Assets/icons/shieldTick.png')}
                  style={styles.statusIcon}
                />
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>IMEI verified</Text>
                  <Text style={styles.statusSubtitle}>{imeiStatus}</Text>
                </View>
              </View>
            )}

            {imei.length > 0 && imei.length < 15 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  IMEI must be 15 digits
                </Text>
              </View>
            )}

            {imei.length === 15 && !imeiVerified && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyIMEI}
              >
                <Text style={styles.verifyButtonText}>Verify IMEI</Text>
              </TouchableOpacity>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !imeiVerified && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!imeiVerified}
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
  formGroup: {
    marginBottom: hp('2%'),
  },
  label: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp('0.8%'),
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#1F2937',
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  scanButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#1F2937',
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
    marginTop: hp('2%'),
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
  warningContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('2%'),
  },
  warningText: {
    fontSize: wp('3%'),
    color: '#92400E',
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  verifyButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#FFFFFF',
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
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
