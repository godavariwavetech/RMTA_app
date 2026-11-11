import React, { useState } from 'react';
import { useScreenBack } from '../../../utils/screenBack';
import {
  Alert,
  Linking,
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
} from '../../../utils/responsive';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updatePurchaseDraft } from '../../../redux/slices/purchaseSlice';
import ImeiScannerModal from '../../../Components/ImeiScannerModal';
import { isValidImei } from '../../../utils/imeiValidation';
import StepNav from '../../../Components/StepNav';
import { istDateTime } from '../../../utils/istDate';

// Official government pages for checking an IMEI (same as the Device Verification screen).
const KYM_URL = 'https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp';
const CEIR_URL = 'https://ceir.sancharsaathi.gov.in/Device/CeirImeiVerification.jsp';

export default function PurchaseEntryStep3({ onNavigate, sellerData, deviceData }) {
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so revisiting this step keeps what was entered.
  const draftImei = useSelector(state => state.purchase.draft.imei) || {};
  const draftImeiValid = !!draftImei.verified && isValidImei(draftImei.imei || '');
  const [imei, setImei] = useState(draftImei.imei || '');
  const [imeiVerified, setImeiVerified] = useState(draftImeiValid);
  // When the IMEI was verified (India time), sent with the purchase as imeiverified_date.
  const [verifiedAt, setVerifiedAt] = useState(draftImeiValid ? draftImei.verifiedAt || null : null);
  const [scannerOpen, setScannerOpen] = useState(false);
  // Which IMEI field the open scanner fills: 1 or 2.
  const [scanTarget, setScanTarget] = useState(1);
  // IMEI 2 is optional, but when entered it must be a valid, different IMEI.
  const [imei2, setImei2] = useState(draftImei.imei2 || '');
  let imei2Error = '';
  if (imei2.length > 0 && imei2.length < 15) {
    imei2Error = `${imei2.length}/15 digits`;
  } else if (imei2.length === 15 && !isValidImei(imei2)) {
    imei2Error = 'Not a valid IMEI number';
  } else if (imei2.length > 0 && imei2 === imei) {
    imei2Error = 'IMEI 2 must be different from IMEI 1';
  }
  const imei2Ok = imei2.length === 0 || imei2Error === '';
  // The technician ticks this after checking the IMEI on Sanchar Saathi.
  const draftCeirVerified = useSelector(state => state.purchase.draft.ceirVerified);
  const [sancharChecked, setSancharChecked] = useState(!!draftCeirVerified);
  // When the box was ticked (India time), sent with the purchase as imei_verified_datetime.
  const draftCeirVerifiedAt = useSelector(state => state.purchase.draft.ceirVerifiedAt);
  const [ceirVerifiedAt, setCeirVerifiedAt] = useState(draftCeirVerified ? draftCeirVerifiedAt || null : null);
  const toggleSancharChecked = () => {
    const next = !sancharChecked;
    setSancharChecked(next);
    setCeirVerifiedAt(next ? istDateTime() : null);
  };

  const openLink = url => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open the link', 'Please open it in a browser: ' + url),
    );
  };
  const [imeiStatus, setImeiStatus] = useState(
    draftImeiValid
      ? `Valid 15-digit format · ${deviceData?.deviceBrand || 'Device'} ${deviceData?.deviceModel || ''}`
      : '',
  );

  const handleScanIMEI = () => {
    setScanTarget(1);
    setScannerOpen(true);
  };

  const handleScanIMEI2 = () => {
    setScanTarget(2);
    setScannerOpen(true);
  };

  const handleImeiChange = (value) => {
    setImei(value);
    setImeiVerified(false);
    setVerifiedAt(null);
    setSancharChecked(false);
    setCeirVerifiedAt(null);
    setImeiStatus('');
  };

  const handleVerifyIMEI = () => {
    const valid = isValidImei(imei);
    setImeiVerified(valid);
    setVerifiedAt(valid ? istDateTime() : null);
    setImeiStatus(
      valid
        ? `Valid IMEI - ${deviceData?.deviceBrand || 'Device'} ${deviceData?.deviceModel || ''}`
        : 'IMEI checksum is invalid. Check the number or scan again.',
    );
  };

  const handleContinue = () => {
    const imeiData = { imei: imei, imei2: imei2, verified: imeiVerified, verifiedAt };
    dispatch(updatePurchaseDraft({ imei: imeiData, ceirVerified: sancharChecked, ceirVerifiedAt }));
    if (onNavigate) {
      onNavigate('purchaseEntryStep5', {
        sellerData: sellerData,
        deviceData: deviceData,
        imeiData: imeiData,
        ceirVerified: sancharChecked,
      });
    }
  };

  // Android system back runs the same save-draft-then-go-back as the Back button.
  useScreenBack(() => handleBackPress());
  const handleBackPress = () => {
    dispatch(
      updatePurchaseDraft({
        imei: { imei: imei, imei2: imei2, verified: imeiVerified, verifiedAt },
        ceirVerified: sancharChecked,
        ceirVerifiedAt,
      }),
    );
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
            <Text style={styles.stepText}>STEP {completedSteps} OF 7 · IMEI</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '42.9%' }]} />
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
                IMEI 1 {/* <Text style={styles.required}>*</Text> */}
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

            {/* IMEI 2 (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>IMEI 2 (optional)</Text>
              <TextInput
                style={[styles.input, !!imei2Error && styles.inputError]}
                placeholder="Enter or scan IMEI 2"
                placeholderTextColor="#9CA3AF"
                value={imei2}
                onChangeText={value => setImei2(value.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={15}
              />
              {!!imei2Error && <Text style={styles.imei2Error}>{imei2Error}</Text>}
            </View>

            <TouchableOpacity style={styles.scanButton} onPress={handleScanIMEI2}>
              <Text style={styles.scanButtonText}>Scan IMEI 2</Text>
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

            {/* Sanchar Saathi checks + confirmation, once the IMEI is valid */}
            {imeiVerified && (
              <View style={styles.sancharCard}>
                <Text style={styles.sancharHeading}>Check this IMEI on Sanchar Saathi</Text>
                <TouchableOpacity style={styles.sancharLink} onPress={() => openLink(KYM_URL)}>
                  <Text style={styles.sancharLinkText}>Know Your Mobile (KYM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sancharLink, styles.sancharLinkSecond]}
                  onPress={() => openLink(CEIR_URL)}
                >
                  <Text style={styles.sancharLinkText}>CEIR IMEI verification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkRow, sancharChecked && styles.checkRowDone, !sancharChecked && styles.checkRowRequired]}
                  onPress={toggleSancharChecked}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkBox, sancharChecked && styles.checkBoxDone]}>
                    {sancharChecked && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.checkText, sancharChecked && styles.checkTextDone]}>
                    IMEI verified on Sanchar Saathi {/* <Text style={styles.required}>*</Text> */}
                  </Text>
                </TouchableOpacity>
                {!sancharChecked && (
                  <Text style={styles.checkHint}>Check the IMEI on Sanchar Saathi, then tick this box to continue.</Text>
                )}
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
            {!!imeiStatus && !imeiVerified && (
              <Text style={styles.warningText}>{imeiStatus}</Text>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        <ImeiScannerModal
          visible={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanned={scannedImei => {
            if (scanTarget === 2) {
              setImei2(scannedImei);
              setScannerOpen(false);
              return;
            }
            setImei(scannedImei);
            const valid = isValidImei(scannedImei);
            setImeiVerified(valid);
            setVerifiedAt(valid ? istDateTime() : null);
            setImeiStatus(
              valid
                ? `Valid IMEI - ${deviceData?.deviceBrand || 'Device'} ${deviceData?.deviceModel || ''}`
                : 'IMEI checksum is invalid. Check the number or scan again.',
            );
            setScannerOpen(false);
          }}
        />

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !imei2Ok && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!imei2Ok}
          >
            <Text style={styles.continueButtonText}>Next</Text>
          </TouchableOpacity>
          </StepNav>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  inputError: {
    borderColor: '#EF4444',
  },
  imei2Error: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  sancharCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: wp('4%'),
    marginTop: hp('2%'),
  },
  sancharHeading: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.2%'),
  },
  sancharLink: {
    backgroundColor: '#EAF1FF',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  sancharLinkSecond: {
    marginTop: hp('1%'),
  },
  sancharLinkText: {
    color: '#2F5DDC',
    fontSize: wp('3.6%'),
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.8%'),
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  checkRowRequired: {
    borderColor: '#FCA5A5',
  },
  checkHint: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    marginLeft: 2,
  },
  checkRowDone: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  checkBoxDone: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  checkText: {
    flex: 1,
    fontSize: wp('3.6%'),
    fontWeight: '600',
    color: '#4B5563',
  },
  checkTextDone: {
    color: '#15803D',
  },
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
