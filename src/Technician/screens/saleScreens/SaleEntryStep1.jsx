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
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { updateSaleDraft, createSaleCustomer } from '../../../redux/slices/saleSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../../utils/mobileValidation';

export default function SaleEntryStep1({ onNavigate }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  // Pre-fill from the saved draft so revisiting this step keeps what was entered.
  const draftBuyer = useSelector(state => state.sale.draft.buyer) || {};
  const [formData, setFormData] = useState({
    buyerName: draftBuyer.buyerName || '',
    buyerMobile: draftBuyer.buyerMobile || '',
    aadhaarNumber: draftBuyer.aadhaarNumber || '',
    address: draftBuyer.address || '',
    buyerPhoto: draftBuyer.buyerPhoto || null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = async () => {
    if (!formData.buyerName.trim() || !formData.buyerMobile.trim() || !formData.address.trim()) {
      Alert.alert('Missing details', 'Please enter the buyer name, mobile number and address.');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.buyerName.trim())) {
      Alert.alert('Invalid name', 'Buyer name should only contain letters.');
      return;
    }

    const mobileDigits = normalizeMobileNumber(formData.buyerMobile);
    if (!isValidIndianMobileNumber(mobileDigits)) {
      Alert.alert('Invalid mobile number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const aadharDigits = formData.aadhaarNumber.replace(/\D/g, '');
    if (aadharDigits && aadharDigits.length !== 12) {
      Alert.alert('Invalid Aadhaar number', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    // Create the customer record up front (POST /public_app/create_sale_customer)
    // so later steps and the final create_sale call can reference its id.
    setSubmitting(true);
    const result = await dispatch(
      createSaleCustomer({
        customer_name: formData.buyerName.trim(),
        customer_number: mobileDigits,
        member_id: user.member_id,
        aadharnumber: aadharDigits,
        address: formData.address.trim(),
      }),
    );
    setSubmitting(false);

    if (!createSaleCustomer.fulfilled.match(result)) {
      const message =
        (result.payload && result.payload.message) ||
        'Could not save buyer details. Please try again.';
      Alert.alert('Could not continue', message);
      return;
    }

    const customerId =
      result.payload &&
      (result.payload.insertId ||
        result.payload.buyer_id ||
        result.payload.customer_id ||
        result.payload.id);
    const buyer = {
      ...formData,
      buyerMobile: mobileDigits,
      customer_id: customerId,
    };

    console.log('[Sale][Step1] buyer captured →', buyer);
    dispatch(updateSaleDraft({ buyer }));
    if (onNavigate) {
      onNavigate('verifyBuyerMobileNumber', {
        buyerData: buyer,
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

        setFormData(prev => ({ ...prev, buyerPhoto: { uri: asset.uri, uploading: true } }));
        try {
          const { response: res, data } = await postJson(ENDPOINTS.UPLOAD_FILE, {
            base64: asset.base64,
            mime_type: asset.type || 'image/jpeg',
            original_name: asset.fileName || 'buyer.jpg',
            uploaded_by: user.user_id,
          });
          if (res.ok && data && data.success !== false) {
            setFormData(prev => ({
              ...prev,
              buyerPhoto: { uri: asset.uri, file_id: data.data.file_id, uploading: false },
            }));
          } else {
            setFormData(prev => ({ ...prev, buyerPhoto: { uri: asset.uri, uploading: false } }));
            Alert.alert('Upload failed', (data && data.message) || 'Please try again.');
          }
        } catch (err) {
          setFormData(prev => ({ ...prev, buyerPhoto: { uri: asset.uri, uploading: false } }));
          Alert.alert('Upload failed', err.message);
        }
      },
    );
  };

  const handleBack = () => {
    dispatch(updateSaleDraft({ buyer: formData }));
    if (onNavigate) {
      onNavigate('home');
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
          <Text style={styles.headerTitle}>Sale Entry</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>STEP {completedSteps} OF 6 · BUYER</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '16.67%' }]} />
        </View>

        {/* Form Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Section Title */}
          <Text style={styles.sectionTitle}>Buyer details</Text>

          {/* Buyer Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Buyer Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter buyer name"
              placeholderTextColor="#9CA3AF"
              value={formData.buyerName}
              onChangeText={(value) => handleInputChange('buyerName', value.replace(/[^a-zA-Z\s]/g, ''))}
              autoCapitalize="words"
            />
          </View>

          {/* Buyer Mobile Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Buyer Mobile <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor="#9CA3AF"
              value={formData.buyerMobile}
              onChangeText={(value) => handleInputChange('buyerMobile', normalizeMobileNumber(value))}
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
              {formData.buyerPhoto && formData.buyerPhoto.uri ? (
                <Image source={{ uri: formData.buyerPhoto.uri }} style={styles.photoPreview} />
              ) : (
                <Image
                  source={require('../../../Assets/icons/camera.png')}
                  style={styles.cameraIcon}
                />
              )}
              <Text style={styles.photoUploadTitle}>
                {formData.buyerPhoto && formData.buyerPhoto.uri
                  ? 'Change buyer photo'
                  : 'Capture buyer photo'}
              </Text>
              {formData.buyerPhoto && formData.buyerPhoto.uploading ? (
                <View style={styles.photoStatusRow}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.photoUploadSubtitle}>Uploading…</Text>
                </View>
              ) : formData.buyerPhoto && formData.buyerPhoto.file_id ? (
                <Text style={[styles.photoUploadSubtitle, styles.photoUploaded]}>✓ Uploaded</Text>
              ) : (
                <Text style={styles.photoUploadSubtitle}>JPG or PNG • Up to 5 MB</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Aadhaar Number Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput
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
            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Enter buyer address"
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
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
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
