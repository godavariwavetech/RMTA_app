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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseImageSource } from '../../../utils/imagePicker';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updatePurchaseDraft } from '../../../redux/slices/purchaseSlice';
import { useFieldNav, FieldNavBar } from '../../../Components/FieldNav';
import StepNav from '../../../Components/StepNav';

export default function PurchaseEntryStep2({ onNavigate, sellerData }) {
  const nav = useFieldNav();
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so revisiting this step keeps what was entered.
  const draftDevice = useSelector(state => state.purchase.draft.device) || {};
  const [formData, setFormData] = useState({
    deviceBrand: draftDevice.deviceBrand || '',
    deviceModel: draftDevice.deviceModel || '',
    storage: draftDevice.storage || '',
    color: draftDevice.color || '',
    devicePhoto: draftDevice.devicePhoto || null,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = () => {
    console.log('[Purchase][Step2] device captured →', formData);
    dispatch(updatePurchaseDraft({ device: formData }));
    if (onNavigate) {
      onNavigate('purchaseEntryStep3', {
        sellerData: sellerData,
        deviceData: formData,
      });
    }
  };

  const handleCapturePhoto = () => {
    chooseImageSource(
      { mediaType: 'photo', includeBase64: true, quality: 0.7 },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Photo error', response.errorMessage || 'Could not pick the image.');
          return;
        }
        const asset = response.assets && response.assets[0];
        if (!asset || !asset.base64) return;

        // Sent as create_purchase's frontimage — raw base64, no upload step.
        setFormData(prev => ({
          ...prev,
          devicePhoto: { uri: asset.uri, base64: asset.base64 },
        }));
      },
    );
  };

  const handleBackPress = () => {
    dispatch(updatePurchaseDraft({ device: formData }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 2;

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
            <Text style={styles.headerTitle}>Purchase Device</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 8 · DEVICE</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '25%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Device Brand Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Device brand</Text>
              <TextInput {...nav.props(0)}
                style={styles.input}
                placeholder="e.g., OnePlus, Samsung"
                placeholderTextColor="#9CA3AF"
                value={formData.deviceBrand}
                onChangeText={(value) => handleInputChange('deviceBrand', value)}
              />
            </View>

            {/* Device Model Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Device model</Text>
              <TextInput {...nav.props(1)}
                style={styles.input}
                placeholder="e.g., 9R, S21"
                placeholderTextColor="#9CA3AF"
                value={formData.deviceModel}
                onChangeText={(value) => handleInputChange('deviceModel', value)}
              />
            </View>

            {/* Storage Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Storage</Text>
              <TextInput {...nav.props(2)}
                style={styles.input}
                placeholder="e.g., 128 GB"
                placeholderTextColor="#9CA3AF"
                value={formData.storage}
                onChangeText={(value) => handleInputChange('storage', value)}
              />
            </View>

            {/* Color Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <TextInput {...nav.props(3)}
                style={styles.input}
                placeholder="e.g., Lake Blue, Black"
                placeholderTextColor="#9CA3AF"
                value={formData.color}
                onChangeText={(value) => handleInputChange('color', value)}
              />
            </View>

            {/* Photo Capture */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.photoUploadContainer}
                onPress={handleCapturePhoto}
              >
                {formData.devicePhoto && formData.devicePhoto.uri ? (
                  <Image
                    source={{ uri: formData.devicePhoto.uri }}
                    style={styles.photoPreview}
                  />
                ) : (
                  <Image
                    source={require('../../../Assets/icons/camera.png')}
                    style={styles.cameraIcon}
                  />
                )}
                <Text style={styles.photoUploadTitle}>
                  {formData.devicePhoto && formData.devicePhoto.uri
                    ? 'Change device photo'
                    : 'Capture device photo'}
                </Text>
                {formData.devicePhoto && formData.devicePhoto.base64 ? (
                  <Text style={[styles.photoUploadSubtitle, styles.photoUploaded]}>✓ Selected</Text>
                ) : (
                  <Text style={styles.photoUploadSubtitle}>JPG or PNG • Up to 5 MB</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Next</Text>
          </TouchableOpacity>
          </StepNav>
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
  formGroup: {
    marginBottom: hp('2%'),
  },
  label: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp('0.8%'),
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
    tintColor: '#2F5DDC',
  },
  photoUploadTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#2F5DDC',
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
