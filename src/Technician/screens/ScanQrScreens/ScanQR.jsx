import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';

export default function ScanQR({ onNavigate }) {
  const [scannedImage, setScannedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCameraLaunch = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      cameraType: 'back',
      quality: 1,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Camera Error', `Error: ${response.errorMessage}`);
      } else {
        processQRCode(response);
      }
    });
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Image Picker Error', `Error: ${response.errorMessage}`);
      } else {
        processQRCode(response);
      }
    });
  };

  const processQRCode = (response) => {
    setIsProcessing(true);
    setScannedImage(response.assets[0]);

    // Simulate QR code processing
    setTimeout(() => {
      Alert.alert('Success', 'QR Code detected successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setIsProcessing(false);
          },
        },
      ]);
    }, 500);
  };

  const handleTestInvalidCode = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onNavigate('invalidQR');
    }, 500);
  };

  const handleSimulateValidScan = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onNavigate('validQR');
    }, 500);
  };

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('goBack')}
          >
            {/* <Text style={styles.backButtonText}>{'<'}</Text> */}
            <Image source={require('../../../Assets/icons/back.png')}  style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.mainTitle}>Scan an RMTA QR code</Text>
            <Text style={styles.subtitle}>Position the member's QR code within the frame.</Text>

            <View style={styles.cameraContainer}>
              {scannedImage ? (
                <Image
                  source={{ uri: scannedImage.uri }}
                  style={styles.previewImage}
                />
              ) : (
                // <View style={styles.cameraPlaceholder}>
                //   <Text style={styles.cameraIcon}>📷</Text>
                //   <Text style={styles.cameraPlaceholderText}>
                //     Tap "Open Camera" or "Pick Image" to scan QR code
                //   </Text>
                // </View>

                <TouchableOpacity 
                  onPress={() => setShowModal(true)}
                  activeOpacity={0.7}
                  style={styles.cameraPlaceholderContainer}
                >
                    <Image source={require('../../../Assets/icons/scanner.png')} style={styles.cameraPlaceholder} />
                    <Text style={styles.cameraPlaceholderText}>Tap to scan QR</Text>
                </TouchableOpacity>

              )}
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>

            <Text style={styles.helperText}>Camera permission  •  Pick type  •  Read</Text>

            <View style={styles.actionButtonsContainer}>

                {/* <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                    <TouchableOpacity 
                        style={styles.cameraButton}
                        onPress={handleCameraLaunch}
                        disabled={isProcessing}
                    >
                        <Text style={styles.cameraButtonText}>📷 Open Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.galleryButton}
                        onPress={handleImagePicker}
                        disabled={isProcessing}
                    >
                        <Text style={styles.galleryButtonText}>🖼️ Pick from Gallery</Text>
                    </TouchableOpacity>
                </View> */}
              

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleTestInvalidCode}
                disabled={isProcessing}
              >
                <Text style={styles.secondaryButtonText}>Test invalid code</Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleSimulateValidScan}
            disabled={isProcessing}
          >
            <Text style={styles.primaryButtonText}>Simulate valid scan</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Camera/Gallery Selection */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose option</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.modalCloseBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalOptions}>
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => {
                    setShowModal(false);
                    handleCameraLaunch();
                  }}
                >
                  <Image source={require('../../../Assets/icons/camera1.png')} style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionText}>Open Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => {
                    setShowModal(false);
                    handleImagePicker();
                  }}
                >
                  <Image source={require('../../../Assets/icons/gallery.png')} style={styles.modalOptionIcon} />
                  <Text style={styles.modalOptionText}>Open Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    // backgroundColor: Colors.primary,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('3%'),
    paddingTop: hp('6%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d6d6d6ff'
  },
  backButton: {
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: Colors.primary,
    height: wp('4%'),
    width: wp('4%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: wp('10%'),
  },
  content: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
  },
  mainTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    color: '#9CA3AF',
    marginBottom: hp('2%'),
  },
  cameraContainer: {
    width: '100%',
    height: hp('40%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: hp('2%'),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    height: wp('100%'),
    width: wp('100%')
  },
  cameraPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: hp('2%'),
  },
  cameraPlaceholderText: {
    textAlign: 'center',
    fontSize: wp('5%'),
    position: 'absolute',
    top: hp('20%'),
    left: wp('26%'),
    zIndex: 1,
    backgroundColor: '#ffffff93',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('4%')
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    marginBottom: hp('2%'),
  },
  actionButtonsContainer: {
    gap: hp('1.2%'),
  },
  cameraButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('5%')
  },
  cameraButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: Colors.primary,
  },
  galleryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '500',
    color: '#9CA3AF',
  },
  primaryButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    paddingBottom: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    width: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseBtn: {
    fontSize: wp('6%'),
    color: '#6B7280',
    fontWeight: '300',
  },
  modalOptions: {
    gap: hp('1.5%'),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    gap: wp('3%'),
  },
  modalOptionIcon: {
    fontSize: wp('8%'),
    height: wp('7%'),
    width: wp('7%')
  },
  modalOptionText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
});
