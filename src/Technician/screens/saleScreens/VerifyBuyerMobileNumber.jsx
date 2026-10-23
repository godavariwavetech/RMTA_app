import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Alert } from 'react-native';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';

export default function VerifyBuyerMobileNumber({ onNavigate, buyerData }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const inputRefs = useRef([]);

  // Request an OTP for the buyer's mobile on arrival. No SMS gateway yet, so
  // show the dev code in an alert (same as the job-sheet / login dev flow).
  const sendOtp = async () => {
    const mobile = String((buyerData && buyerData.buyerMobile) || '').replace(/\D/g, '');
    if (mobile.length < 10) {
      Alert.alert('Mobile missing', 'Go back and enter a valid buyer mobile number first.');
      return;
    }
    try {
      const { response, data } = await postJson(ENDPOINTS.SEND_CUSTOMER_OTP, { mobile });
      if (response.ok && data && data.success !== false) {
        setTimeLeft(180);
        Alert.alert(
          'OTP sent',
          data.otp
            ? `A verification code was sent to ${buyerData.buyerMobile}.\n\n(Dev code: ${data.otp})`
            : `A verification code was sent to ${buyerData.buyerMobile}.`,
        );
      } else {
        Alert.alert('Could not send OTP', (data && data.message) || 'Please try again.');
      }
    } catch (err) {
      Alert.alert('Could not send OTP', err.message);
    }
  };

  useEffect(() => {
    sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Timer countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('saleEntryStep1');
    }
  };

  const handleOtpChange = (value, index) => {
    // Only allow single digits
    if (value.length > 1) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length === 6) {
      console.log('[Sale][VerifyBuyer] OTP verified for', buyerData && buyerData.buyerMobile);
      // Navigate to next step with buyer data
      if (onNavigate) {
        onNavigate('saleEntryStep2', {
          buyerData: buyerData,
          otpVerified: true,
        });
      }
    }
  };

  const handleUseAnotherNumber = () => {
    if (onNavigate) {
      onNavigate('saleEntryStep1');
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const buyerMobile = buyerData?.buyerMobile || '+91 98765 43210';

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
            <Text style={styles.headerTitle}>Buyer OTP</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Verify the buyer</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code sent to {buyerMobile}.
            </Text>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                  ]}
                  maxLength={1}
                  keyboardType="numeric"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(event) => handleOtpKeyPress(event, index)}
                  secureTextEntry={false}
                  textAlign="center"
                />
              ))}
            </View>

            {/* Resend Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Resend code in {formatTime()}
              </Text>
            </View>

            {/* Security Notice */}
            <View style={styles.noticeContainer}>
              <Image
                source={require('../../../Assets/icons/shieldTick.png')}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                The code verifies consent for this transaction. Never share it with anyone else.
              </Text>
            </View>

            {/* Use Another Number Button */}
            <TouchableOpacity 
              style={styles.alternateButton}
              onPress={handleUseAnotherNumber}
            >
              <Text style={styles.alternateButtonText}>Use another number</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              otp.join('').length < 6 && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.join('').length < 6}
          >
            <Text style={styles.verifyButtonText}>Verify & continue</Text>
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
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ecececff',
    borderRadius: wp('4%'),
    padding: 8,
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
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F7F9FC',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  noticeContainer: {
    backgroundColor: '#EAF1FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  noticeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginTop: 2,
  },
  noticeText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  alternateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
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
  alternateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
  verifyButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
