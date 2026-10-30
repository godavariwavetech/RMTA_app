import React, { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';
import { useI18n } from '../../../i18n';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../../redux/slices/authSlice';
import { isValidIndianMobileNumber, normalizeMobileNumber } from '../../../utils/mobileValidation';

export default function LoginScreen({ onNavigate, initialMode }) {
  const { t } = useI18n();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [messageModal, setMessageModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const passwordInput = useRef(null);
  // 'technician' or 'admin' — defaults to technician, but can be preselected
  // (e.g. RegisterScreen sends 'admin' when the account already exists).
  const [loginMode, setLoginMode] = useState(initialMode || 'technician');

  const dispatch = useDispatch();

  const showMessageModal = (title, message, action) => {
    setMessageModal({ title, message, action });
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleBackPress = () => {
    if (loginMode === 'admin') {
      setLoginMode('technician');
    } else if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleForgotPassword = () => {
    if (onNavigate) {
      onNavigate('forgotPassword');
    }
  };

  const handleLoginWithOTP = () => {
    if (onNavigate) {
      onNavigate('loginOTP');
    }
  };

  const handleAdminLogin = () => {
    setLoginMode('admin');
    setLoginError('');
  };

  const handleTechnicianLogin = () => {
    setLoginMode('technician');
    setLoginError('');
  };

  const handleRegister = () => {
    if (onNavigate) {
      // Carry the current tab so registration creates the right account type.
      onNavigate('register', { user_ind: loginMode === 'admin' ? 1 : 0 });
    }
  };

  const handleSignIn = async () => {
    if (!onNavigate || isSubmitting) return;
    Keyboard.dismiss();
    setLoginError('');

    const errors = {};
    if (!mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required.';
    } else if (!isValidIndianMobileNumber(mobileNumber)) {
      errors.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!password.trim()) {
      errors.password = 'Password is required.';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      showMessageModal('Check your details', Object.values(errors).join('\n'));
      return;
    }

    // user_ind: 1 = admin login, 0 = technician login
    const user_ind = loginMode === 'admin' ? 1 : 0;
    console.log('[Login] Submitting account type:', user_ind === 1 ? 'admin' : 'technician');

    setIsSubmitting(true);
    let result;
    try {
      result = await dispatch(
        loginUser({ user_ind, mobile: normalizeMobileNumber(mobileNumber), password }),
      );
    } finally {
      setIsSubmitting(false);
    }

    if (loginUser.fulfilled.match(result)) {
      const status = String(result.payload?.membership_status || '').toLowerCase();
      if (status === 'pending') {
        // Account exists but an admin hasn't approved it yet.
        onNavigate('statusPending');
      } else if (status === 'active') {
        // Admin and technician accounts use the same app home screen.
        onNavigate('home');
      } else {
        // expired / suspended / rejected / unknown
        setLoginError(
          status
            ? `Your account is "${status}". Please contact the administrator.`
            : 'We could not verify your account status. Please try again or contact the administrator.',
        );
        showMessageModal(
          'Unable to sign in',
          status
            ? `Your account is "${status}". Please contact the administrator.`
            : 'We could not verify your account status. Please try again or contact the administrator.',
        );
      }
    } else {
      const payload = result.payload;
      const notFound =
        payload &&
        (payload.code === 'ACCOUNT_NOT_FOUND' || payload.status === 404);

      if (notFound && loginMode === 'admin') {
        // Non-existing admin number → prompt them to register.
        showMessageModal(
          'No account found',
          "You don't have an account. Register now.",
          {
            label: 'Register',
            onPress: () => onNavigate('register', { user_ind: 1 }),
          },
        );
      } else {
        // Wrong password, server error, or network/timeout.
        const message =
          (payload && payload.message) || 'Login failed. Please try again.';
        setLoginError(message);
        showMessageModal('Sign in failed', message);
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
          keyboardVerticalOffset={0}
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
              <Text style={styles.headerTitle}>
                {loginMode === 'admin' ? t('adminAccess') : t('welcomeToRmta')}
              </Text>
              <View style={styles.placeholderButton} />
            </View>
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >


            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <ImageBackground
                source={require('../../../Assets/images/LoginBgImg.png')}
                style={styles.welcomeCardContent}
                resizeMode="cover"
              >
                {/* Overlay for better text visibility */}
                <View style={styles.welcomeCardOverlay} />

                <View style={styles.welcomeCardTextContainer}>
                  <Image
                    source={require('../../../Assets/images/appLogo.png')}
                    style={styles.welcomeLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.welcomeTitle}>
                    {loginMode === 'admin'
                      ? t('manageWithConfidence')
                      : t('welcomeBack')}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {loginMode === 'admin'
                      ? t('adminSecure')
                      : t('shopJobsMembership')}
                  </Text>
                </View>
              </ImageBackground>
            </View>

            {/* Login mode toggle — above the Mobile number field.
               Technician login is selected initially (default loginMode). */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  loginMode === 'technician' && styles.modeButtonSelected,
                ]}
                onPress={handleTechnicianLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    loginMode === 'technician' && styles.modeButtonTextSelected,
                  ]}
                >
                  {t('technicianLogin')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  loginMode === 'admin' && styles.modeButtonSelected,
                ]}
                onPress={handleAdminLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    loginMode === 'admin' && styles.modeButtonTextSelected,
                  ]}
                >
                  {t('adminLogin')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Number Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t('mobileNumber')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#999999"
                  value={mobileNumber}
                  onChangeText={text => {
                    setMobileNumber(normalizeMobileNumber(text));
                    setLoginError('');
                    if (validationErrors.mobileNumber) {
                      setValidationErrors(current => ({ ...current, mobileNumber: undefined }));
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInput.current?.focus()}
                />
              </View>
              {!!validationErrors.mobileNumber && (
                <Text style={styles.validationError}>{validationErrors.mobileNumber}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t('password')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={passwordInput}
                  style={styles.input}
                  placeholder={t('enterPassword')}
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    setLoginError('');
                    if (validationErrors.password) {
                      setValidationErrors(current => ({ ...current, password: undefined }));
                    }
                  }}
                  secureTextEntry={!isPasswordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
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
              {!!validationErrors.password && (
                <Text style={styles.validationError}>{validationErrors.password}</Text>
              )}
            </View>
            {!!loginError && <Text style={styles.loginError}>{loginError}</Text>}

            {/* Forgot Password — plain text link (not a button) */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Register link — Admin tab only. Technicians don't self-register;
               an admin creates their account, then they log in from the
               Technician tab with those credentials. */}
            {loginMode === 'admin' && (
              <TouchableOpacity
                style={styles.registerLinkContainer}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLinkText}>
                  Don't have an account?{' '}
                  <Text style={styles.registerLinkHighlight}>{t('register')}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer with Sign In Button */}
          {!(Platform.OS === 'android' && keyboardVisible) && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInButtonText}>{t('signIn')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={!!messageModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMessageModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{messageModal?.title}</Text>
            <Text style={styles.modalMessage}>{messageModal?.message}</Text>
            <View style={styles.modalActions}>
              {messageModal?.action && (
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => setMessageModal(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  const action = messageModal?.action;
                  setMessageModal(null);
                  action?.onPress();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryText}>
                  {messageModal?.action?.label || 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('2%'),
  },
  header: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
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
    fontSize: wp('9%'),
    color: '#1F2937',
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: wp('8%'),
  },
  welcomeCard: {
    marginHorizontal: wp('5%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('2.5%'),
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
    paddingVertical: hp('2.8%'),
    paddingHorizontal: wp('5%'),
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  welcomeCardBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
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
    width: wp('17%'),
    height: hp('8%'),
    marginBottom: hp('1%'),
  },
  welcomeTitle: {
    fontSize: wp('5.6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('0.5%'),
  },
  welcomeSubtitle: {
    fontSize: wp('3.6%'),
    fontWeight: '400',
    color: '#FFFFFF',
    // textAlign: 'center',
    lineHeight: hp('2.5%'),
  },
  fieldContainer: {
    marginHorizontal: wp('5%'),
    marginVertical: hp('1.2%'),
  },
  fieldLabel: {
    fontSize: wp('3.7%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.7%'),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('3%'),
  },
  input: {
    flex: 1,
    paddingVertical: hp('1.35%'),
    fontSize: wp('4%'),
    color: '#1F2937',
  },
  validationError: {
    color: '#DC2626',
    fontSize: wp('3.2%'),
    marginTop: hp('0.5%'),
  },
  loginError: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    marginHorizontal: wp('5%'),
    marginTop: hp('0.3%'),
    fontSize: wp('3.4%'),
    lineHeight: hp('2.2%'),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('7%'),
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2.5%'),
    paddingBottom: hp('2%'),
    elevation: 10,
  },
  modalTitle: {
    color: '#1F2937',
    fontSize: wp('4.8%'),
    fontWeight: '700',
    marginBottom: hp('1%'),
  },
  modalMessage: {
    color: '#4B5563',
    fontSize: wp('3.8%'),
    lineHeight: hp('2.6%'),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginTop: hp('2.5%'),
  },
  modalPrimaryButton: {
    minWidth: wp('22%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: wp('3.7%'),
    fontWeight: '700',
  },
  modalSecondaryButton: {
    minWidth: wp('22%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalSecondaryText: {
    color: '#4B5563',
    fontSize: wp('3.7%'),
    fontWeight: '600',
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
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('5%'),
    marginTop: hp('0.5%'),
    marginBottom: hp('0.5%'),
    gap: wp('3%'),
  },
  modeButton: {
    flex: 1,
    paddingVertical: hp('1.3%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeButtonSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  modeButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  modeButtonTextSelected: {
    color: '#FFFFFF',
  },
  forgotPasswordContainer: {
    marginHorizontal: wp('4%'),
    marginTop: hp('0.5%'),
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: wp('3.5%'),
    color: Colors.secondary,
    fontWeight: '600',
  },
  registerLinkContainer: {
    marginHorizontal: wp('5%'),
    marginTop: hp('1.5%'),
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    top: 0,
    minHeight: hp('6%'),
  },
  registerLinkText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  registerLinkHighlight: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  loginOptionsContainer: {
    flexDirection: 'row',
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    gap: wp('3%'),
  },
  loginOptionButton: {
    flex: 1,
    paddingVertical: hp('1.3%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginOptionText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  adminLoginButton: {
    flex: 1,
    paddingVertical: hp('1.3%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adminLoginText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  spacer: {
    height: hp('2%'),
  },
  footer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('1.4%'),
    paddingBottom: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signInButton: {
    paddingVertical: hp('1.7%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  signInButtonText: {
    fontSize: wp('4.1%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
