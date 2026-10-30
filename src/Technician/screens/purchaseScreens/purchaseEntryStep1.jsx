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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseImageSource } from '../../../utils/imagePicker';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updatePurchaseDraft, createPurchaseCustomer } from '../../../redux/slices/purchaseSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../../utils/mobileValidation';
import { useFieldNav, FieldNavBar } from '../../../Components/FieldNav';

export default function PurchaseEntryStep1({ onNavigate }) {
  const nav = useFieldNav();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  // Pre-fill from the saved draft so revisiting this step keeps what was entered.
  const draftSeller = useSelector(state => state.purchase.draft.seller) || {};
  const [formData, setFormData] = useState({
    sellerName: draftSeller.sellerName || '',
    sellerMobile: draftSeller.sellerMobile || '',
    aadhaarNumber: draftSeller.aadhaarNumber || '',
    address: draftSeller.address || '',
    sellerPhoto: draftSeller.sellerPhoto || null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = async () => {
    if (!formData.sellerName.trim() || !formData.sellerMobile.trim() || !formData.address.trim()) {
      Alert.alert('Missing details', 'Please enter the seller name, mobile number and address.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.sellerName.trim())) {
      Alert.alert('Invalid name', 'Seller name should only contain letters.');
      return;
    }

    const mobileDigits = normalizeMobileNumber(formData.sellerMobile);
    if (!isValidIndianMobileNumber(mobileDigits)) {
      Alert.alert('Invalid mobile number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const aadharDigits = formData.aadhaarNumber.replace(/\D/g, '');
    if (aadharDigits && aadharDigits.length !== 12) {
      Alert.alert('Invalid Aadhaar number', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    // Create the customer record up front (POST /public_app/create_purchase_customer)
    // so later steps and the final create_purchase call can reference its id.
    setSubmitting(true);
    const result = await dispatch(
      createPurchaseCustomer({
        customer_name: formData.sellerName.trim(),
        mobile_number: mobileDigits,
        member_id: user.member_id,
        aadharnumber: aadharDigits,
        address: formData.address.trim(),
        customer_image: formData.sellerPhoto && formData.sellerPhoto.base64 ? formData.sellerPhoto.base64 : null,
        photo_file_id: formData.sellerPhoto && formData.sellerPhoto.file_id ? formData.sellerPhoto.file_id : null,
      }),
    );
    setSubmitting(false);

    if (!createPurchaseCustomer.fulfilled.match(result)) {
      const message =
        (result.payload && result.payload.message) ||
        'Could not save seller details. Please try again.';
      Alert.alert('Could not continue', message);
      return;
    }

    // The backend returns the raw MySQL insert result (OkPacket), not a
    // record — the new customer's id is insertId.
    const customerId =
      result.payload &&
      (result.payload.insertId ||
        result.payload.seller_id ||
        result.payload.customer_id ||
        result.payload.id);
    const savedSellerPhoto = formData.sellerPhoto
      ? { uri: formData.sellerPhoto.uri || null, file_id: formData.sellerPhoto.file_id || null }
      : null;
    const seller = {
      ...formData,
      sellerPhoto: savedSellerPhoto,
      sellerMobile: mobileDigits,
      customer_id: customerId,
    };
    dispatch(updatePurchaseDraft({ seller }));
    if (onNavigate) {
      onNavigate('verifySellerMobileNumber', {
        sellerData: seller,
      });
    }
  };

  const handleCapturePhoto = () => {
    chooseImageSource(
      { mediaType: 'photo', includeBase64: true, quality: 0.7 },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Photo error', response.errorMessage || 'Could not pick the image.');
          return;
        }
        const asset = response.assets && response.assets[0];
        if (!asset || !asset.base64) return;

        setFormData(prev => ({
          ...prev,
          sellerPhoto: { uri: asset.uri, base64: asset.base64, uploading: false },
        }));
      },
    );
  };

  const handleBack = () => {
    dispatch(updatePurchaseDraft({ seller: formData }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 1;

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
          <Text style={styles.headerTitle}>Purchase Entry</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => onNavigate && onNavigate('viewPurchaseHistory')}
          >
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>STEP {completedSteps} OF 8 · SELLER</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '12.5%' }]} />
        </View>

        {/* Form Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Seller details</Text>

          {/* Seller Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Seller Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput {...nav.props(0)}
              style={styles.input}
              placeholder="Enter seller name"
              placeholderTextColor="#9CA3AF"
              value={formData.sellerName}
              onChangeText={(value) => handleInputChange('sellerName', value.replace(/[^a-zA-Z\s]/g, ''))}
              autoCapitalize="words"
            />
          </View>

          {/* Seller Mobile Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Seller Mobile <Text style={styles.required}>*</Text>
            </Text>
            <TextInput {...nav.props(1)}
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor="#9CA3AF"
              value={formData.sellerMobile}
              onChangeText={(value) => handleInputChange('sellerMobile', normalizeMobileNumber(value))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Photo Capture */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo</Text>
            <TouchableOpacity
              style={styles.photoUploadContainer}
              onPress={handleCapturePhoto}
            >
              {formData.sellerPhoto && formData.sellerPhoto.uri ? (
                <Image
                  source={{ uri: formData.sellerPhoto.uri }}
                  style={styles.photoPreview}
                />
              ) : (
                <Image
                  source={require('../../../Assets/icons/camera.png')}
                  style={styles.cameraIcon}
                />
              )}
              <Text style={styles.photoUploadTitle}>
                {formData.sellerPhoto && formData.sellerPhoto.uri
                  ? 'Change seller photo'
                  : 'Capture seller photo'}
              </Text>
              {formData.sellerPhoto && formData.sellerPhoto.uploading ? (
                <View style={styles.photoStatusRow}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.photoUploadSubtitle}>Uploading…</Text>
                </View>
              ) : formData.sellerPhoto && (formData.sellerPhoto.file_id || formData.sellerPhoto.base64) ? (
                <Text style={[styles.photoUploadSubtitle, styles.photoUploaded]}>Photo ready</Text>
              ) : (
                <Text style={styles.photoUploadSubtitle}>JPG or PNG • Up to 5 MB</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Aadhaar Number Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput {...nav.props(2)}
              style={styles.input}
              placeholder="Enter Aadhaar number"
              placeholderTextColor="#9CA3AF"
              value={formData.aadhaarNumber}
              onChangeText={(value) => handleInputChange('aadhaarNumber', value)}
              secureTextEntry={true}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          {/* Address Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput {...nav.props(3)}
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Enter seller address"
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.spacer} />
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
  historyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#EEF3FF',
  },
  historyButtonText: { fontSize: 13, fontWeight: '700', color: '#2F5DDC' },
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('2%'),
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
  textArea: {
    paddingVertical: hp('1.2%'),
    minHeight: hp('12%'),
  },
  photoUploadContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  cameraIcon: {
    width: wp('8%'),
    height: wp('8%'),
    marginBottom: hp('1%'),
    tintColor: '#0066FF',
  },
  photoUploadTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: hp('0.4%'),
  },
  photoUploadSubtitle: {
    fontSize: wp('3%'),
    color: '#9CA3AF',
  },
  photoPreview: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
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
  spacer: {
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
