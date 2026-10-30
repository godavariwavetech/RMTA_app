import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
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

const MAX_PHOTOS = 3;

export default function PurchaseEntryStep5({ onNavigate, sellerData, deviceData, imeiData, ceirVerified }) {
  const dispatch = useDispatch();
  const draftCondition = useSelector(state => state.purchase.draft.condition);
  const draftConditionPhotos = useSelector(state => state.purchase.draft.conditionPhotos);
  const [condition, setCondition] = useState(
    draftCondition || {
      screen: 'Damaged',
      body: 'Good',
      camera: 'Working',
      speaker: 'Working',
      chargingPort: 'Working',
      battery: 'Good',
    },
  );

  // Up to 3 condition photos: { uri, base64 }. They are sent as
  // create_purchase's backimage. Restore from draft.
  const [photos, setPhotos] = useState(
    Array.isArray(draftConditionPhotos)
      ? draftConditionPhotos
          .filter(p => p && p.base64)
          .map(p => ({ uri: p.uri || null, base64: p.base64 }))
      : [],
  );

  const handleConditionSelect = (category, value) => {
    setCondition(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handlePickPhotos = () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }
    chooseImageSource(
      { mediaType: 'photo', includeBase64: true, quality: 0.7, selectionLimit: remaining },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Photo error', response.errorMessage || 'Could not pick the image.');
          return;
        }
        const assets = (response.assets || []).slice(0, remaining).filter(a => a && a.base64);
        setPhotos(prev => [
          ...prev,
          ...assets.map(asset => ({ uri: asset.uri, base64: asset.base64 })),
        ]);
      },
    );
  };

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Keep the local uri too so the previews show when revisiting this step.
  const buildConditionPhotos = () =>
    photos.filter(p => p && p.base64).map(p => ({ base64: p.base64, uri: p.uri || null }));

  const handleContinue = () => {
    const conditionPhotos = buildConditionPhotos();
    dispatch(updatePurchaseDraft({ condition: condition, conditionPhotos: conditionPhotos }));
    if (onNavigate) {
      onNavigate('purchaseEntryStep6', {
        sellerData: sellerData,
        deviceData: deviceData,
        imeiData: imeiData,
        ceirVerified: ceirVerified,
        conditionData: condition,
      });
    }
  };

  const handleBackPress = () => {
    dispatch(
      updatePurchaseDraft({ condition: condition, conditionPhotos: buildConditionPhotos() }),
    );
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 5;

  const screenOptions = ['Good', 'Damaged', 'Cracked', 'Dead on Arrival'];
  const bodyOptions = ['Good', 'Scratched', 'Damaged'];
  const workingOptions = ['Working', 'Not working'];
  const batteryOptions = ['Good', 'Weak', 'Damaged'];

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
            <Text style={styles.headerTitle}>Device Condition</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 8 · CONDITION</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '62.5%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Inspect the device</Text>
            <Text style={styles.sectionDescription}>
              Record its condition before accepting it.
            </Text>

            {/* Screen Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Screen</Text>
              <View style={styles.optionsContainer}>
                {screenOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.screen === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('screen', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.screen === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Body Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Body</Text>
              <View style={styles.optionsContainer}>
                {bodyOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.body === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('body', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.body === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Camera Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Camera</Text>
              <View style={styles.optionsContainer}>
                {workingOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.camera === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('camera', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.camera === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Speaker Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Speaker</Text>
              <View style={styles.optionsContainer}>
                {workingOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.speaker === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('speaker', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.speaker === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Charging Port Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Charging port</Text>
              <View style={styles.optionsContainer}>
                {workingOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.chargingPort === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('chargingPort', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.chargingPort === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Battery Condition */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>Battery</Text>
              <View style={styles.optionsContainer}>
                {batteryOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      condition.battery === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleConditionSelect('battery', option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        condition.battery === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Photo Upload Section */}
            <View style={styles.conditionGroup}>
              <Text style={styles.conditionLabel}>
                Condition photos ({photos.length}/{MAX_PHOTOS})
              </Text>

              {photos.length > 0 && (
                <View style={styles.thumbRow}>
                  {photos.map((photo, index) => (
                    <View key={photo.uri || index} style={styles.thumbWrapper}>
                      {photo.uri ? (
                        <Image source={{ uri: photo.uri }} style={styles.thumb} />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <Text style={styles.thumbPlaceholderText}>✓</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() => removePhoto(index)}
                      >
                        <Text style={styles.thumbRemoveText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.photoUploadContainer} onPress={handlePickPhotos}>
                  <Image
                    source={require('../../../Assets/icons/camera.png')}
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.photoUploadTitle}>Front, back & damage photos</Text>
                  <Text style={styles.photoUploadSubtitle}>
                    JPG or PNG · up to {MAX_PHOTOS} photos
                  </Text>
                </TouchableOpacity>
              )}
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
  conditionGroup: {
    marginBottom: hp('2.5%'),
  },
  conditionLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  optionText: {
    fontSize: wp('3.2%'),
    fontWeight: '500',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  photoUploadContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  thumbWrapper: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('2%'),
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: wp('2%'),
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumbPlaceholder: {
    backgroundColor: '#EAF1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 24,
    color: '#2F5DDC',
    fontWeight: '700',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbRemoveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
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
