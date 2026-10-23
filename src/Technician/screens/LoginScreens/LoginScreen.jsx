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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../../redux/slices/authSlice';

export default function LoginScreen({ onNavigate, initialMode }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // 'technician' or 'admin' — defaults to technician, but can be preselected
  // (e.g. RegisterScreen sends 'admin' when the account already exists).
  const [loginMode, setLoginMode] = useState(initialMode || 'technician');

  const dispatch = useDispatch();

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
  };

  const handleTechnicianLogin = () => {
    setLoginMode('technician');
  };

  const handleRegister = () => {
    if (onNavigate) {
      // Carry the current tab so registration creates the right account type.
      onNavigate('register', { user_ind: loginMode === 'admin' ? 1 : 0 });
    }
  };

  const handleSignIn = async () => {
    if (!onNavigate) return;

    // Validate inputs
    if (!mobileNumber.trim() || !password.trim()) {
      alert('Please enter mobile number and password');
      return;
    }

    // user_ind: 1 = admin login, 0 = technician login
    const user_ind = loginMode === 'admin' ? 1 : 0;

    const result = await dispatch(
      loginUser({ user_ind, mobile: mobileNumber.trim(), password }),
    );

    if (loginUser.fulfilled.match(result)) {
      // const status = result.payload && result.payload.membership_status;
      const status = 'active';
      if (status === 'pending') {
        // Account exists but an admin hasn't approved it yet.
        onNavigate('statusPending');
      } else if (status === 'active') {
        // Approved → into the app.
        onNavigate(loginMode === 'admin' ? 'adminHome' : 'home');
      } else {
        // expired / suspended / rejected / unknown
        alert(
          `Your account is "${status || 'inactive'}". Please contact the administrator.`,
        );
      }
    } else {
      const payload = result.payload;
      const notFound =
        payload &&
        (payload.code === 'ACCOUNT_NOT_FOUND' || payload.status === 404);

      if (notFound && loginMode === 'admin') {
        // Non-existing admin number → prompt them to register.
        Alert.alert(
          'No account found',
          "You don't have an account. Register now.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Register',
              onPress: () => onNavigate('register', { user_ind: 1 }),
            },
          ],
        );
      } else {
        // Wrong password, server error, or network/timeout.
        const message =
          (payload && payload.message) || 'Login failed. Please try again.';
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
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
                {loginMode === 'admin' ? 'Admin access' : 'Welcome to RMTA'}
              </Text>
              <View style={styles.placeholderButton} />
            </View>

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
                      ? 'Manage with confidence.'
                      : 'Welcome back.'}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {loginMode === 'admin'
                      ? 'Secure access for RMTA administrators.'
                      : 'Your shop, jobs and membership. All in one place.'}
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
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    loginMode === 'technician' && styles.modeButtonTextSelected,
                  ]}
                >
                  Technician login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  loginMode === 'admin' && styles.modeButtonSelected,
                ]}
                onPress={handleAdminLogin}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    loginMode === 'admin' && styles.modeButtonTextSelected,
                  ]}
                >
                  Admin login
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Number Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mobile number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#999999"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
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

            {/* Forgot Password — plain text link (not a button) */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
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
                  <Text style={styles.registerLinkHighlight}>Register</Text>
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer with Sign In Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
            >
              <Text style={styles.signInButtonText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    // color: '#5B8DEE',
    fontWeight: '300',
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
    // textAlign: 'center',
    lineHeight: hp('2.3%'),
  },
  fieldContainer: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('1.5%'),
  },
  fieldLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.8%'),
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
  input: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: '#1F2937',
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
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
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
    marginHorizontal: wp('4%'),
    // marginTop: hp('1.8%'),
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    top: 0,
    height: hp('10%'),
    // backgroundColor :'#ffff'
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
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  signInButton: {
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
  signInButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
