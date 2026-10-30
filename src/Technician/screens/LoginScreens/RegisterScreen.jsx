import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseImageSource } from '../../../utils/imagePicker';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';
import { useDispatch } from 'react-redux';
import { registerMember } from '../../../redux/slices/authSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../../utils/mobileValidation';

// Base URL + endpoint paths now live in src/Constants/config.js and the API
// call lives in the auth slice (redux/slices/authSlice.js).

export default function RegisterScreen({ onNavigate, userInd }) {
  const [tried, setTried] = useState(false);
  // Only the fields the backend's POST /public_app/member_registertion accepts.
  // (confirmPassword is UI-only — used to validate, never sent.)
  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    shopName: '',
    shopAddress: '',
    city: '',
    state: '',
    password: '',
    confirmPassword: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalView, setLegalView] = useState(null);

  // Shop photo / person photo: { uri, base64 } or null. Sent to the backend
  // as raw base64 under shop_image / person_image — no separate upload step.
  const [shopImage, setShopImage] = useState(null);
  const [personImage, setPersonImage] = useState(null);

  const dispatch = useDispatch();

  // Which login type initiated this registration (passed from LoginScreen).
  // 1 = admin (default), 0 = technician. These are separate accounts server-side.
  const user_ind = userInd === 0 ? 0 : 1;

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handlePickImage = setter => {
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
        setter({ uri: asset.uri, base64: asset.base64 });
      },
    );
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleSignIn = () => {
    if (onNavigate) {
      onNavigate('login');
    }
  };

  const handleRegister = async () => {
    if (!onNavigate) return;

    const {
      fullName,
      mobileNumber,
      shopName,
      shopAddress,
      city,
      state,
      password,
      confirmPassword,
    } = form;

    setTried(true);
    // Validate required inputs
    if (
      !fullName.trim() ||
      !mobileNumber.trim() ||
      !shopName.trim() ||
      !shopAddress.trim() ||
      !city.trim() ||
      !state.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      alert('Please fill in all required fields');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      alert('Full name should only contain letters');
      return;
    }

    if (!isValidIndianMobileNumber(mobileNumber)) {
      alert('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(city.trim())) {
      alert('City should only contain letters');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(state.trim())) {
      alert('State should only contain letters');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      alert('Please accept the Terms & Conditions to continue');
      return;
    }

    // Build the registration payload using the exact field names the backend
    // accepts: POST /public_app/member_registertion reads only these keys.
    const registrationData = {
      full_name: fullName.trim(),
      mobile: normalizeMobileNumber(mobileNumber),
      shop_name: shopName.trim(),
      address: shopAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      password,
      membership_status: 'pending',
      user_ind, // 1 = admin, 0 = technician (separate account namespaces)
      shop_image: shopImage ? shopImage.base64 : null,
      person_image: personImage ? personImage.base64 : null,
    };

    // Dispatch the registration thunk (defined in redux/slices/authSlice.js).
    // It handles the fetch, timeout, duplicate/error responses, and stores the
    // result in redux. Here we just branch on fulfilled vs rejected.
    const result = await dispatch(registerMember(registrationData));

    if (registerMember.fulfilled.match(result)) {
      // Success means the mobile number did NOT already exist and the account
      // was created. Send them to Login (matching tab) to sign in with the
      // mobile + password they just set.
      Alert.alert(
        'Registration successful',
        'You can now log in with your mobile number and password.',
        [
          {
            text: 'OK',
            onPress: () =>
              onNavigate('login', {
                loginMode: user_ind === 1 ? 'admin' : 'technician',
              }),
          },
        ],
      );
    } else {
      // Rejected: duplicate mobile (409), server error (500), or network/timeout.
      const payload = result.payload;
      const message =
        (payload && payload.message) ||
        'Registration failed. Please try again.';

      if (payload && payload.status === 409) {
        // Account already exists → on OK, take them to Login with the matching tab.
        Alert.alert('Account already exists', message, [
          {
            text: 'OK',
            onPress: () =>
              onNavigate('login', {
                loginMode: user_ind === 1 ? 'admin' : 'technician',
              }),
          },
        ]);
      } else {
        alert(message);
      }
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor="#F5F5F5"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Register Now</Text>
              <View style={styles.placeholderButton} />
            </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >


            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <ImageBackground
                source={require('../../../Assets/images/LoginBgImg.png')}
                style={styles.welcomeCardContent}
                resizeMode="cover"
              >
                <View style={styles.welcomeCardOverlay} />

                <View style={styles.welcomeCardTextContainer}>
                  <Image
                    source={require('../../../Assets/images/appLogo.png')}
                    style={styles.welcomeLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.welcomeTitle}>Join RMTA.</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Register your shop to manage jobs, purchases and membership.
                  </Text>
                </View>
              </ImageBackground>
            </View>

            {/* Full Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full name <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, tried && !String(form.fullName).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                  value={form.fullName}
                  onChangeText={text => updateField('fullName', text.replace(/[^a-zA-Z\s]/g, ''))}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Number Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mobile number <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, tried && !String(form.mobileNumber).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#999999"
                  value={form.mobileNumber}
                  onChangeText={text => updateField('mobileNumber', normalizeMobileNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Shop / Business Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shop / Business name <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, tried && !String(form.shopName).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your shop name"
                  placeholderTextColor="#999999"
                  value={form.shopName}
                  onChangeText={text => updateField('shopName', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Shop Address Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shop address <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, tried && !String(form.shopAddress).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Street, area, landmark"
                  placeholderTextColor="#999999"
                  value={form.shopAddress}
                  onChangeText={text => updateField('shopAddress', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* City & State Row */}
            <View style={styles.rowContainer}>
              <View style={styles.rowFieldContainer}>
                <Text style={styles.fieldLabel}>City <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, tried && !String(form.city).trim() && styles.inputWrapperError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#999999"
                    value={form.city}
                    onChangeText={text => updateField('city', text.replace(/[^a-zA-Z\s]/g, ''))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={styles.rowFieldContainer}>
                <Text style={styles.fieldLabel}>State <Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, tried && !String(form.state).trim() && styles.inputWrapperError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#999999"
                    value={form.state}
                    onChangeText={text => updateField('state', text.replace(/[^a-zA-Z\s]/g, ''))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Shop Photo & Person Photo Row */}
            <View style={styles.rowContainer}>
              <View style={styles.rowFieldContainer}>
                <Text style={styles.fieldLabel}>Shop photo</Text>
                <TouchableOpacity
                  style={styles.photoPicker}
                  onPress={() => handlePickImage(setShopImage)}
                  activeOpacity={0.8}
                >
                  {shopImage ? (
                    <Image source={{ uri: shopImage.uri }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <Image
                        source={require('../../../Assets/icons/camera.png')}
                        style={styles.photoPickerIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.photoPickerText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.rowFieldContainer}>
                <Text style={styles.fieldLabel}>Person photo</Text>
                <TouchableOpacity
                  style={styles.photoPicker}
                  onPress={() => handlePickImage(setPersonImage)}
                  activeOpacity={0.8}
                >
                  {personImage ? (
                    <Image source={{ uri: personImage.uri }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <Image
                        source={require('../../../Assets/icons/camera.png')}
                        style={styles.photoPickerIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.photoPickerText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, tried && !String(form.password).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#999999"
                  value={form.password}
                  onChangeText={text => updateField('password', text)}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeIcon}
                >
                  <Image
                    source={
                      isPasswordVisible
                        ? require('../../../Assets/icons/eyeOpen.png')
                        : require('../../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Confirm password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, tried && !String(form.confirmPassword).trim() && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#999999"
                  value={form.confirmPassword}
                  onChangeText={text => updateField('confirmPassword', text)}
                  secureTextEntry={!isConfirmVisible}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                  style={styles.eyeIcon}
                >
                  <Image
                    source={
                      isConfirmVisible
                        ? require('../../../Assets/icons/eyeOpen.png')
                        : require('../../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms & Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxChecked,
                ]}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                activeOpacity={0.75}
              >
                {acceptedTerms && <Text style={styles.checkboxTick}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  accessibilityRole="link"
                  onPress={() => setLegalView('terms')}
                >
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  accessibilityRole="link"
                  onPress={() => setLegalView('privacy')}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>


            {/* Sign In Link */}
            <TouchableOpacity
              style={styles.signInLinkButton}
              onPress={handleSignIn}
            >
              <Text style={styles.signInLinkText}>
                Already have an account?{' '}
                <Text style={styles.signInLinkHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer with Register Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={!!legalView}
        animationType="slide"
        onRequestClose={() => setLegalView(null)}
      >
        <SafeAreaView style={styles.legalScreen}>
          <View style={styles.legalHeader}>
            <TouchableOpacity
              onPress={() => setLegalView(null)}
              style={styles.legalBackButton}
              accessibilityRole="button"
              accessibilityLabel="Back to registration"
            >
              <Text style={styles.legalBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.legalTitle}>
              {legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </Text>
            <View style={styles.legalHeaderSpacer} />
          </View>
          <ScrollView contentContainerStyle={styles.legalContent}>
            <Text style={styles.legalNoticeTitle}>Document unavailable</Text>
            <Text style={styles.legalNotice}>
              The current RMTA {legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              {' '}document has not been added to the app. Please contact an RMTA administrator
              for the current document before registering.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#EF4444',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: wp('8%'),
  },
  welcomeCard: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  welcomeCardContent: {
    backgroundColor: Colors.primary,
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('4%'),
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  welcomeCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 26, 61, 0.6)',
  },
  welcomeCardTextContainer: {
    zIndex: 1,
    paddingVertical: hp('1%'),
  },
  welcomeLogo: {
    width: wp('20%'),
    height: hp('10%'),
    marginBottom: hp('1%'),
  },
  welcomeTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('0.5%'),
  },
  welcomeSubtitle: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: hp('2.3%'),
  },
  fieldContainer: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('1.5%'),
  },
  rowContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginVertical: hp('1.5%'),
    gap: wp('3%'),
  },
  rowFieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.8%'),
  },
  optionalLabel: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2.5%'),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('3%'),
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: '#1F2937',
  },
  textArea: {
    minHeight: hp('8%'),
  },
  photoPicker: {
    height: hp('11%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPickerIcon: {
    width: wp('6%'),
    height: wp('6%'),
    marginBottom: hp('0.5%'),
  },
  photoPickerText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: Colors.secondary,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  roleRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  roleOption: {
    flex: 1,
    paddingVertical: hp('1.3%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleOptionText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconImage: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#6B7280',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: wp('4%'),
    marginVertical: hp('1.5%'),
  },
  checkbox: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('1.5%'),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    marginTop: hp('0.2%'),
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: wp('3.3%'),
    color: '#6B7280',
    lineHeight: hp('2.2%'),
  },
  termsLink: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  legalScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  legalHeader: {
    minHeight: hp('7%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  legalBackButton: {
    width: wp('10%'),
    paddingVertical: hp('0.5%'),
  },
  legalBackText: {
    fontSize: wp('8%'),
    color: '#1F2937',
  },
  legalTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
    fontSize: wp('4.5%'),
    fontWeight: '700',
  },
  legalHeaderSpacer: {
    width: wp('10%'),
  },
  legalContent: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('3%'),
  },
  legalNoticeTitle: {
    color: '#1F2937',
    fontSize: wp('5%'),
    fontWeight: '700',
    marginBottom: hp('1.5%'),
  },
  legalNotice: {
    color: '#4B5563',
    fontSize: wp('3.8%'),
    lineHeight: hp('2.8%'),
  },
  signInLinkButton: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('1%'),
    alignItems: 'center',
  },
  signInLinkText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  signInLinkHighlight: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  registerButton: {
    paddingVertical: hp('1.6%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  registerButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
