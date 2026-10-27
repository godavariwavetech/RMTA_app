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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseImageSource } from '../../../utils/imagePicker';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { updateJobDraft } from '../../../redux/slices/jobSheetSlice';

const MAX_PHOTOS = 3;

export default function CreateJobSheetStep3({ onNavigate }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const draftConditionPhotos = useSelector(
    state => state.jobSheet.draft.conditionPhotos,
  );
  const draftConditions = useSelector(state => state.jobSheet.draft.conditions);

  // Nothing selected by default — the technician chooses each one. Overridden
  // by anything saved in the draft so navigating back keeps their choices.
  const defaultSelections = {
    screen: '',
    body: '',
    camera: '',
    speaker: '',
    chargingPort: '',
    battery: '',
  };
  // Map the backend component names back to the local selection keys.
  const componentToKey = {
    screen: 'screen',
    body: 'body',
    camera: 'camera',
    speaker: 'speaker',
    charging_port: 'chargingPort',
    battery: 'battery',
  };
  const [selections, setSelections] = useState(() => {
    if (!Array.isArray(draftConditions)) return defaultSelections;
    const restored = { ...defaultSelections };
    draftConditions.forEach(c => {
      const key = componentToKey[c.component];
      if (key) restored[key] = c.condition_value;
    });
    return restored;
  });

  // Up to 3 condition photos: { uri, file_id, uploading }. Restore any already
  // uploaded in the draft so revisiting this step keeps them.
  const [photos, setPhotos] = useState(
    Array.isArray(draftConditionPhotos)
      ? draftConditionPhotos
          .filter(p => p && p.file_id)
          .map(p => ({ uri: p.uri || null, file_id: p.file_id, uploading: false }))
      : [],
  );

  const uploadOne = async asset => {
    // Add a local preview immediately, keyed by its uri; mark as uploading.
    setPhotos(prev => [...prev, { uri: asset.uri, uploading: true }]);
    try {
      const { response: res, data } = await postJson(ENDPOINTS.UPLOAD_FILE, {
        base64: asset.base64,
        mime_type: asset.type || 'image/jpeg',
        original_name: asset.fileName || 'condition.jpg',
        uploaded_by: user.user_id,
      });
      if (res.ok && data && data.success !== false) {
        setPhotos(prev =>
          prev.map(p =>
            p.uri === asset.uri
              ? { ...p, file_id: data.data.file_id, uploading: false }
              : p,
          ),
        );
      } else {
        setPhotos(prev =>
          prev.map(p => (p.uri === asset.uri ? { ...p, uploading: false } : p)),
        );
        Alert.alert('Upload failed', (data && data.message) || 'Please try again.');
      }
    } catch (err) {
      setPhotos(prev =>
        prev.map(p => (p.uri === asset.uri ? { ...p, uploading: false } : p)),
      );
      Alert.alert('Upload failed', err.message);
    }
  };

  const handlePickPhotos = () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }
    chooseImageSource(
      { mediaType: 'photo', includeBase64: true, quality: 0.7, selectionLimit: remaining },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Photo error', response.errorMessage || 'Could not pick the image.');
          return;
        }
        const assets = (response.assets || []).slice(0, remaining);
        for (const asset of assets) {
          if (asset && asset.base64) {
            // eslint-disable-next-line no-await-in-loop
            await uploadOne(asset);
          }
        }
      },
    );
  };

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const buildDraft = () => {
    // Map the UI selections to the condition_checks component enum.
    const componentMap = {
      screen: 'screen',
      body: 'body',
      camera: 'camera',
      speaker: 'speaker',
      chargingPort: 'charging_port',
      battery: 'battery',
    };
    const conditions = Object.keys(selections)
      .filter(key => selections[key]) // skip anything not chosen yet
      .map(key => ({
        component: componentMap[key],
        condition_value: selections[key],
      }));
    // Only keep successfully uploaded photos (those with a file_id). Keep the
    // local uri too so the thumbnail shows when revisiting this step.
    const conditionPhotos = photos
      .filter(p => p && p.file_id)
      .map(p => ({ photo_type: 'other', file_id: p.file_id, uri: p.uri || null }));
    return { conditions, conditionPhotos };
  };

  const handleBackPress = () => {
    // Persist current edits so they're kept when navigating back.
    dispatch(updateJobDraft(buildDraft()));
    if (onNavigate) {
      onNavigate('createJobSheetStep2');
    }
  };

  const handleContinue = () => {
    // Every condition field must be answered before moving on.
    const unanswered = Object.keys(selections).filter(k => !selections[k]);
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete',
        'Please choose a condition for every field before continuing.',
      );
      return;
    }
    const { conditions, conditionPhotos } = buildDraft();
    dispatch(updateJobDraft({ conditions, conditionPhotos }));
    console.log('[JobSheet][Step3] conditions captured →', conditions, conditionPhotos);
    if (onNavigate) {
      onNavigate('createJobSheetStep4');
    }
  };

  const handleSelection = (category, value) => {
    setSelections((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const conditionCategories = [
    {
      id: 'screen',
      label: 'Screen',
      options: ['Good', 'Damaged', 'Cracked'],
    },
    {
      id: 'body',
      label: 'Body',
      options: ['Good', 'Scratched', 'Damaged'],
    },
    {
      id: 'camera',
      label: 'Camera',
      options: ['Working', 'Not working'],
    },
    {
      id: 'speaker',
      label: 'Speaker',
      options: ['Working', 'Not working'],
    },
    {
      id: 'chargingPort',
      label: 'Charging port',
      options: ['Working', 'Not working'],
    },
    {
      id: 'battery',
      label: 'Battery',
      options: ['Good', 'Weak', 'Damaged'],
    },
  ];

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Device Condition</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 3 OF 8 · CONDITION</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '37.5%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Inspect the device</Text>
            <Text style={styles.sectionDescription}>
              Record its condition before accepting it.
            </Text>

            {/* Condition Categories */}
            <View style={styles.categoriesContainer}>
              {conditionCategories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <View style={styles.optionsContainer}>
                    {category.options.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          selections[category.id] === option &&
                            styles.optionButtonSelected,
                        ]}
                        onPress={() => handleSelection(category.id, option)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selections[category.id] === option &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {/* Camera Section */}
            <View style={styles.photoSection}>
              <Text style={styles.categoryLabel}>
                Select photos Upto ({photos.length}/{MAX_PHOTOS})
              </Text>

              {/* Thumbnails of selected / uploaded photos */}
              {photos.length > 0 && (
                <View style={styles.thumbRow}>
                  {photos.map((photo, index) => (
                    <View key={photo.uri || photo.file_id || index} style={styles.thumbWrapper}>
                      {photo.uri ? (
                        <Image source={{ uri: photo.uri }} style={styles.thumb} />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <Text style={styles.thumbPlaceholderText}>✓</Text>
                        </View>
                      )}
                      {photo.uploading && (
                        <View style={styles.thumbOverlay}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
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

              {/* Add-photo button, hidden once the limit is reached */}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.photoButton} onPress={handlePickPhotos}>
                  <Image
                    source={require('../../../Assets/icons/camera.png')}
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.photoText}>Front, back & damage photos</Text>
                  <Text style={styles.photoSubtext}>
                    JPG or PNG - up to {MAX_PHOTOS} photos
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
    // backgroundColor: '#FFFFFF',
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
  categoriesContainer: {
    gap: 20,
    marginBottom: 24,
  },
  categorySection: {
    gap: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: wp('2.8%'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonSelected: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  photoSection: {
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thumbWrapper: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: 12,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
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
  photoButton: {
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
    tintColor: '#2F5DDC',
  },
  photoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F5DDC',
    marginBottom: 4,
  },
  photoSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
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
