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
import { registerMember } from '../../../redux/slices/authSlice';

// Base URL + endpoint paths now live in src/Constants/config.js and the API
// call lives in the auth slice (redux/slices/authSlice.js).

export default function RegisterScreen({ onNavigate, userInd }) {
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

  const dispatch = useDispatch();

  // Which login type initiated this registration (passed from LoginScreen).
  // 1 = admin (default), 0 = technician. These are separate accounts server-side.
  const user_ind = userInd === 0 ? 0 : 1;

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
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

    if (mobileNumber.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid mobile number');
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
      mobile: mobileNumber.trim(),
      shop_name: shopName.trim(),
      address: shopAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      password,
      membership_status: 'pending',
      user_ind, // 1 = admin, 0 = technician (separate account namespaces)
    };

    console.log('📝 Register button pressed — registration data:');
    console.log(JSON.stringify(registrationData, null, 2));

    // Dispatch the registration thunk (defined in redux/slices/authSlice.js).
    // It handles the fetch, timeout, duplicate/error responses, and stores the
    // result in redux. Here we just branch on fulfilled vs rejected.
    const result = await dispatch(registerMember(registrationData));

    if (registerMember.fulfilled.match(result)) {
      // Success means the mobile number did NOT already exist and the account
      // was created. Branch on the returned membership_status:
      //   'pending' → account awaiting admin approval → StatusPendingScreen
      //   otherwise → straight into the app (Admin home).
      console.log('🟢 DB WRITE OK — record stored', result.payload);
      const membershipStatus =
        result.payload && result.payload.membership_status;
      if (membershipStatus === 'pending') {
        onNavigate('statusPending');
      } else {
        onNavigate(user_ind === 1 ? 'adminHome' : 'home');
      }
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
              <Text style={styles.headerTitle}>Register Now</Text>
              <View style={styles.placeholderButton} />
            </View>

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
              <Text style={styles.fieldLabel}>Full name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                  value={form.fullName}
                  onChangeText={text => updateField('fullName', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Number Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mobile number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#999999"
                  value={form.mobileNumber}
                  onChangeText={text => updateField('mobileNumber', text)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Shop / Business Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shop / Business name</Text>
              <View style={styles.inputWrapper}>
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
              <Text style={styles.fieldLabel}>Shop address</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
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
                <Text style={styles.fieldLabel}>City</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#999999"
                    value={form.city}
                    onChangeText={text => updateField('city', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={styles.rowFieldContainer}>
                <Text style={styles.fieldLabel}>State</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#999999"
                    value={form.state}
                    onChangeText={text => updateField('state', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
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
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <View style={styles.inputWrapper}>
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
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxChecked,
                ]}
              >
                {acceptedTerms && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
            

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
