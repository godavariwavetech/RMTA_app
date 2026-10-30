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
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updateJobDraft } from '../../../redux/slices/jobSheetSlice';

// One photo per category; create_job_sheets takes them as raw base64.
const PHOTO_CATEGORIES = [
  { id: 'front', title: 'Front view' },
  { id: 'back', title: 'Back view' },
  { id: 'damage', title: 'Visible damage' },
];

export default function CreateJobSheetStep3({ onNavigate }) {
  const dispatch = useDispatch();
  const draftPhotos = useSelector(state => state.jobSheet.draft.photos);
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

  // Per-category photo state: { uri, base64 }. Restored from the draft so
  // navigating back keeps them.
  const [photos, setPhotos] = useState(() => {
    const restored = {};
    if (Array.isArray(draftPhotos)) {
      draftPhotos.forEach(p => {
        if (p && p.base64) {
          restored[p.photo_type] = { uri: p.uri || null, base64: p.base64 };
        }
      });
    }
    return restored;
  });

  const pickPhoto = categoryId => {
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
        setPhotos(prev => ({
          ...prev,
          [categoryId]: { uri: asset.uri, base64: asset.base64 },
        }));
      },
    );
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
    // Keep the local uri too so the previews show when revisiting this step.
    const photoList = Object.keys(photos)
      .filter(key => photos[key] && photos[key].base64)
      .map(key => ({
        photo_type: key,
        base64: photos[key].base64,
        uri: photos[key].uri || null,
      }));
    return { conditions, photos: photoList, conditionPhotos: [] };
  };

  const handleBackPress = () => {
    // Persist current edits so they're kept when navigating back.
    dispatch(updateJobDraft(buildDraft()));
    if (onNavigate) {
      onNavigate('goBack');
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
    const draft = buildDraft();
    dispatch(updateJobDraft(draft));
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
      options: ['Good', 'Damaged', 'Cracked', 'Dead on Arrival'],
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
            <Text style={styles.stepText}>STEP 3 OF 7 · CONDITION</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '42.86%' }]} />
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

            {/* Device photos */}
            <View style={styles.photoSection}>
              <Text style={styles.categoryLabel}>Device photos</Text>
              <View style={styles.photoGrid}>
                {PHOTO_CATEGORIES.map(category => {
                  const photo = photos[category.id];
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.photoCard}
                      onPress={() => pickPhoto(category.id)}
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
                      <Text style={styles.photoTitle}>{category.title}</Text>
                      <Text style={[styles.photoSubtext, photo && styles.photoUploaded]}>
                        {photo ? '✓ Tap to replace' : 'JPG or PNG'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  photoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F5DDC',
    marginBottom: 2,
    textAlign: 'center',
  },
  photoUploaded: {
    color: '#10B981',
    fontWeight: '600',
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
