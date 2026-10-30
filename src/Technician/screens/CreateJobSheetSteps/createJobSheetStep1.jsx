import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseImageSource } from '../../../utils/imagePicker';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import {
  updateJobDraft,
  resetJobDraft,
  createJobSheetCustomer,
} from '../../../redux/slices/jobSheetSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../../utils/mobileValidation';
import { useFieldNav, FieldNavBar } from '../../../Components/FieldNav';

export default function CreateJobSheetStep1({ onNavigate, fresh }) {
  const nav = useFieldNav();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const draftCustomer = useSelector(state => state.jobSheet.draft.customer) || {};

  // Pre-fill from the saved draft so returning here (e.g. "Use another number"
  // on the verify screen, or "Edit details" from the review step) keeps
  // everything the technician already entered.
  const [customerName, setCustomerName] = useState(draftCustomer.full_name || '');
  const [mobileNumber, setMobileNumber] = useState(draftCustomer.mobile || '');
  const [alternateNumber, setAlternateNumber] = useState(draftCustomer.alternate_mobile || '');
  const [aadharNumber, setAadharNumber] = useState(draftCustomer.aadhaar_number || '');

  // Keep the photo locally and send its base64 with the customer record.
  const [photo, setPhoto] = useState(
    draftCustomer.photo_file_id || draftCustomer.photo_uri
      ? {
          uri: draftCustomer.photo_uri || null,
          file_id: draftCustomer.photo_file_id || null,
          base64: draftCustomer.photo_base64 || null,
          uploading: false,
        }
      : null,
  );

  const [submitting, setSubmitting] = useState(false);

  // Only wipe the draft when starting a brand-new job sheet (entered from the
  // jobs list / home / + button, which pass `fresh`). Navigating back here to
  // edit must keep the data.
  useEffect(() => {
    if (fresh) {
      dispatch(resetJobDraft());
      setCustomerName('');
      setMobileNumber('');
      setAlternateNumber('');
      setAadharNumber('');
      setPhoto(null);
    }
  }, [fresh, dispatch]);

  const handleCapturePhoto = () => {
    chooseImageSource(
      { mediaType: 'photo', includeBase64: true, quality: 0.65, maxWidth: 1200, maxHeight: 1200 },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Photo error', response.errorMessage || 'Could not pick the image.');
          return;
        }
        const asset = response.assets && response.assets[0];
        if (!asset || !asset.base64) return;

        // The customer endpoint accepts the image as base64. Upload it with
        // the customer form instead of sending a separate upload_file call.
        setPhoto({ uri: asset.uri, base64: asset.base64, uploading: false });
      },
    );
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleContinue = async () => {
    if (!customerName.trim() || !mobileNumber.trim()) {
      Alert.alert('Missing details', 'Please enter the customer name and mobile number.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(customerName.trim())) {
      Alert.alert('Invalid name', 'Customer name should only contain letters.');
      return;
    }

    const mobileDigits = normalizeMobileNumber(mobileNumber);
    if (!isValidIndianMobileNumber(mobileDigits)) {
      Alert.alert('Invalid mobile number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const alternateDigits = alternateNumber.replace(/\D/g, '');
    if (alternateDigits && !isValidIndianMobileNumber(alternateDigits)) {
      Alert.alert('Invalid alternate number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const aadharDigits = aadharNumber.replace(/\D/g, '');
    if (aadharDigits && aadharDigits.length !== 12) {
      Alert.alert('Invalid Aadhar number', 'Please enter a valid 12-digit Aadhar number.');
      return;
    }

    // Create the customer record up front (POST /public_app/create_job_sheet_customer)
    // so later steps and the final create_job_sheet call can reference its id.
    setSubmitting(true);
    const result = await dispatch(
      createJobSheetCustomer({
        customer_name: customerName.trim(),
        customer_number: mobileDigits,
        customer_alternatenumber: alternateDigits,
        member_id: user.member_id,
        // Previously the photo was uploaded but never attached to the
        // customer, and the Aadhaar number wasn't sent at all.
        aadharnumber: aadharDigits,
        customer_image: photo && photo.base64 ? photo.base64 : null,
        photo_file_id: photo && photo.file_id ? photo.file_id : null,
      }),
    );
    setSubmitting(false);

    if (!createJobSheetCustomer.fulfilled.match(result)) {
      const message =
        (result.payload && result.payload.message) ||
        'Could not save customer details. Please try again.';
      Alert.alert('Could not continue', message);
      return;
    }

    // This backend returns the raw MySQL insert result (OkPacket) here, not a
    // record — the new customer's id is insertId (see the same fix in
    // purchaseEntryStep1.jsx for create_purchase_customer).
    const customerId =
      result.payload &&
      (result.payload.insertId || result.payload.customer_id || result.payload.id);

    // Save customer details into the draft, then go verify the mobile number.
    const customer = {
      customer_id: customerId,
      full_name: customerName.trim(),
      mobile: normalizeMobileNumber(mobileNumber),
      alternate_mobile: normalizeMobileNumber(alternateNumber),
      aadhaar_last4: aadharNumber.replace(/\D/g, '').slice(-4),
      // Keep the full value + photo preview uri so revisiting this step can
      // restore exactly what the technician entered (the backend uses
      // aadhaar_last4 / photo_file_id; these extras are for the draft only).
      aadhaar_number: aadharNumber,
      photo_file_id: photo && photo.file_id ? photo.file_id : null,
      photo_uri: photo && photo.uri ? photo.uri : null,
      photo_base64: photo && photo.base64 ? photo.base64 : null,
      consent: true,
    };
    dispatch(updateJobDraft({ customer }));
    console.log('[JobSheet][Step1] customer captured →', customer);
    if (onNavigate) {
      onNavigate('verifyMobileNumber');
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
            <Text style={styles.headerTitle}>New Job Sheet</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 1 OF 7 · CUSTOMER</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '14.29%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Customer details</Text>
            <Text style={styles.sectionDescription}>
              Start with the person bringing in the device.
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Customer Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Customer Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput {...nav.props(0)}
                  style={styles.input}
                  placeholder="Enter customer name"
                  placeholderTextColor="#D1D5DB"
                  value={customerName}
                  onChangeText={text => setCustomerName(text.replace(/[^a-zA-Z\s]/g, ''))}
                  autoCapitalize="words"
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Mobile Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput {...nav.props(1)}
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#D1D5DB"
                  value={mobileNumber}
                  onChangeText={text => setMobileNumber(normalizeMobileNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Alternate Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Alternate Number</Text>
                <TextInput {...nav.props(2)}
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor="#D1D5DB"
                  value={alternateNumber}
                  onChangeText={text => setAlternateNumber(normalizeMobileNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Aadhar Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Aadhar Number</Text>
                <TextInput {...nav.props(3)}
                  style={styles.input}
                  placeholder="Enter aadhar number"
                  placeholderTextColor="#D1D5DB"
                  value={aadharNumber}
                  onChangeText={setAadharNumber}
                  keyboardType="number-pad"
                  maxLength={12}
                />
              </View>

              {/* Camera Section */}
              <View style={styles.cameraSection}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleCapturePhoto}
                  activeOpacity={0.8}
                >
                  {photo && photo.uri ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  ) : (
                    <Image
                      source={require('../../../Assets/icons/camera.png')}
                      style={styles.cameraIcon}
                    />
                  )}
                  <Text style={styles.cameraText}>
                    {photo && photo.uri ? 'Change customer photo' : 'Capture customer photo'}
                  </Text>
                  {photo && photo.uploading ? (
                    <View style={styles.photoStatusRow}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.cameraSubtext}>Uploading…</Text>
                    </View>
                  ) : photo && (photo.file_id || photo.base64) ? (
                    <Text style={[styles.cameraSubtext, styles.photoUploaded]}>
                      ✓ Photo ready
                    </Text>
                  ) : (
                    <Text style={styles.cameraSubtext}>JPG or PNG - Up to 5 MB</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Consent Notice */}
              <View style={styles.consentContainer}>
                <Image
                  source={require('../../../Assets/icons/shieldTick.png')}
                  style={styles.consentIcon}
                />
                <Text style={styles.consentText}>
                  Collect identity information only with customer consent.
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      <FieldNavBar nav={nav} />
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
  formContainer: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cameraSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  cameraButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cameraIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 8,
    // tintColor: Colors.primary,
  },
  cameraText: {
    fontSize: 16,
    fontWeight: '600',
    // color: Colors.primary,
    color: '#2F5DDC',
    marginBottom: 4,
  },
  cameraSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  photoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoUploaded: {
    color: '#10B981',
    fontWeight: '600',
  },
  consentContainer: {
    backgroundColor: '#EAF1FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  consentIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginTop: 2,
    // tintColor: Colors.primary,
  },
  consentText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
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
  continueButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
