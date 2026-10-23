import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { verifyForgotOtp, sendForgotOtp } from '../../redux/slices/authSlice';

export default function ForgotPassStep2({ onNavigate, mobile }) {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputs = useRef([]);

  // Timer for resend code
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');

    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (numericValue && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Move to previous input if value is deleted
    if (!numericValue && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyAndContinue = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter the complete 6-digit code');
      return;
    }

    const result = await dispatch(verifyForgotOtp({ mobile, otp: otpCode }));
    if (verifyForgotOtp.fulfilled.match(result)) {
      // Carry the verified mobile + otp to the reset step.
      onNavigate('forgotPassStep3', { mobile, otp: otpCode });
    } else {
      const message =
        (result.payload && result.payload.message) ||
        'OTP verification failed. Please try again.';
      alert(message);
    }
  };

  const handleUseAnotherNumber = () => {
    if (onNavigate) {
      onNavigate('forgotPassStep1');
    }
  };

  const handleResendCode = async () => {
    setOtp(['', '', '', '', '', '']);
    setResendTimer(30);
    setCanResend(false);
    otpInputs.current[0]?.focus();

    const result = await dispatch(sendForgotOtp({ mobile }));
    if (sendForgotOtp.fulfilled.match(result)) {
      const devOtp = result.payload && result.payload.otp;
      if (devOtp) {
        alert(`A new code was sent.\n\n(Dev code: ${devOtp})`);
      }
    }
  };

  const mobileNumber = mobile || 'your number';

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
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Verify your number</Text>
              <View style={styles.placeholderButton} />
            </View>

            {/* Main Title */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Verify it's you</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {mobileNumber}.
              </Text>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpSection}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                    ]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    placeholder="•"
                    placeholderTextColor="#D1D5DB"
                  />
                ))}
              </View>
            </View>

            {/* Resend Code — countdown while waiting, tappable once it elapses */}
            <View style={styles.resendSection}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendCode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendLink}>Resend code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendText}>
                  Resend code in 0:{String(resendTimer).padStart(2, '0')}
                </Text>
              )}
            </View>

            {/* Security Info */}
            <View style={styles.securitySection}>
              <View style={styles.securityIconContainer}>
                <Text style={styles.securityIcon}>🔒</Text>
              </View>
              <Text style={styles.securityText}>
                The code verifies consent for this transaction. Never share it with anyone else.
              </Text>
            </View>

            {/* Use Another Number Button */}
            <View style={styles.anotherNumberSection}>
              <TouchableOpacity
                style={styles.anotherNumberButton}
                onPress={handleUseAnotherNumber}
              >
                <Text style={styles.anotherNumberText}>Use another number</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Verify & Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyAndContinue}
            >
              <Text style={styles.verifyButtonText}>Verify & continue</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: hp('2%'),
  },

  /* Header */
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    // color: Colors.secondary,
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

  /* Title Section */
  titleSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('3%'),
  },
  mainTitle: {
    fontSize: wp('6.5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1%'),
    lineHeight: hp('3.5%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: hp('2.3%'),
  },

  /* OTP Section */
  otpSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('3%'),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('2%'),
  },
  otpInput: {
    flex: 1,
    height: wp('14%'),
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  otpInputFilled: {
    borderColor: Colors.secondary,
    backgroundColor: '#FFFFFF',
  },

  /* Resend Section */
  resendSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  resendText: {
    fontSize: wp('3%'),
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  resendLink: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },

  /* Security Section */
  securitySection: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2.5%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: '#F0F4FF',
    borderRadius: wp('2.5%'),
  },
  securityIconContainer: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.3%'),
  },
  securityIcon: {
    fontSize: wp('4%'),
  },
  securityText: {
    flex: 1,
    fontSize: wp('3%'),
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: hp('2.1%'),
  },

  /* Another Number Section */
  anotherNumberSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  anotherNumberButton: {
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anotherNumberText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Spacer */
  spacer: {
    height: hp('3%'),
  },

  /* Button Container */
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  verifyButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  verifyButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
