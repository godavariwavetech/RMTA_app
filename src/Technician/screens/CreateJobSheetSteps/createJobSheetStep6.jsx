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

export default function CreateJobSheetStep6({ onNavigate }) {
  const dispatch = useDispatch();
  const draftPhotos = useSelector(state => state.jobSheet.draft.photos);

  // Per-category photo state: { uri, base64 }. create_job_sheets takes the
  // front/back/damage images as raw base64 (no separate upload_file step).
  // Restore from the draft so navigating back keeps them.
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

  const pickAndUpload = categoryId => {
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

  const buildPhotos = () =>
    // Keep the local uri too so the previews show when revisiting this step.
    Object.keys(photos)
      .filter(key => photos[key] && photos[key].base64)
      .map(key => ({
        photo_type: key,
        base64: photos[key].base64,
        uri: photos[key].uri || null,
      }));

  const handleBackPress = () => {
    // Persist uploaded photos so they're kept when navigating back.
    dispatch(updateJobDraft({ photos: buildPhotos() }));
    if (onNavigate) {
      onNavigate('createJobSheetStep5');
    }
  };

  const handleContinue = () => {
    const uploaded = buildPhotos();
    dispatch(updateJobDraft({ photos: uploaded }));
    console.log('[JobSheet][Step6] photos captured →', uploaded);
    if (onNavigate) {
      onNavigate('createJobSheetStep7');
    }
  };

  const photoCategories = [
    {
      id: 'front',
      title: 'Front view',
      subtitle: 'JPG or PNG - Up to 5 MB',
      icon: require('../../../Assets/icons/camera.png'),
    },
    {
      id: 'back',
      title: 'Back view',
      subtitle: 'JPG or PNG - Up to 5 MB',
      icon: require('../../../Assets/icons/camera.png'),
    },
    {
      id: 'damage',
      title: 'Visible damage',
      subtitle: 'JPG or PNG - Up to 5 MB',
      icon: require('../../../Assets/icons/camera.png'),
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
            <Text style={styles.headerTitle}>Device Photos</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 6 OF 8 · PHOTOS</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>

          {/* Device Reference Image */}
          <View style={styles.deviceReferenceContainer}>
            <Image
              source={require('../../../Assets/images/sampleMobileImg.png')}
              style={styles.deviceImage}
            />
            <Text style={styles.deviceReferenceText}>
              Device reference - capture actual condition below
            </Text>
          </View>

          

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Document the device</Text>
            <Text style={styles.sectionDescription}>
              Clear photos protect you and your customer.
            </Text>

            {/* Photo Upload Sections */}
            <View style={styles.photoContainer}>
              {photoCategories.map((category) => {
                const p = photos[category.id];
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.photoCard}
                    onPress={() => pickAndUpload(category.id)}
                    activeOpacity={0.8}
                  >
                    {p && p.uri ? (
                      <Image source={{ uri: p.uri }} style={styles.photoPreview} />
                    ) : (
                      <Image source={category.icon} style={styles.cameraIcon} />
                    )}
                    <Text style={styles.photoTitle}>{category.title}</Text>
                    {p && p.base64 ? (
                      <Text style={[styles.photoSubtitle, styles.photoUploaded]}>
                        ✓ Selected · Tap to replace
                      </Text>
                    ) : (
                      <Text style={styles.photoSubtitle}>{category.subtitle}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
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
  deviceReferenceContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ecececff',
    marginTop: hp('2%'),
    // width: wp('90%')
    marginHorizontal: wp('5%'),
    borderRadius: wp('3%')
  },
  deviceImage: {
    width: wp('50%'),
    height: hp('17%'),
    // resizeMode: 'contain',
  },
  deviceReferenceText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
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
  photoContainer: {
    gap: 16,
  },
  photoCard: {
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
    marginBottom: 12,
    // tintColor: Colors.primary,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F5DDC',
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 12,
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
