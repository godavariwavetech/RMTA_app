import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { updateJobDraft } from '../../redux/slices/jobSheetSlice';
import OtpInput from '../../Components/OtpInput';

export default function VerifyMobileNumber({ onNavigate }) {
  const dispatch = useDispatch();
  const customerMobile = useSelector(
    state => (state.jobSheet.draft.customer && state.jobSheet.draft.customer.mobile) || '',
  );
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(3030);
  const [verifying, setVerifying] = useState(false);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleSkip = () => {
    if (onNavigate) {
      onNavigate('createJobSheetStep2');
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) return;

    // The backend's verify_customer_otp doesn't actually check the OTP
    // digits (it accepts any 6-digit code for a registered mobile), so
    // enforce the known fixed dev OTP client-side instead of trusting it.
    if (fullOtp !== '123456') {
      Alert.alert('Incorrect code', 'Please check the code and try again.');
      return;
    }

    const mobile = (customerMobile || '').replace(/\D/g, '');
    setVerifying(true);
    try {
      const payload = { mobile, otp: fullOtp };
      console.log(
        `[JobSheet][VerifyOTP] ${ENDPOINTS.VERIFY_CUSTOMER_OTP} payload →`,
        payload,
      );
      const { response, data } = await postJson(ENDPOINTS.VERIFY_CUSTOMER_OTP, payload);
      console.log(
        `[JobSheet][VerifyOTP] response → HTTP ${response.status}`,
        data,
      );
      if (response.ok && data && data.success !== false) {
        // Save the customer-consent OTP into the draft, then continue.
        dispatch(updateJobDraft({ consent_otp: fullOtp }));
        console.log('[JobSheet][VerifyOTP] consent OTP verified →', fullOtp);
        if (onNavigate) {
          onNavigate('createJobSheetStep2');
        }
      } else {
        Alert.alert('Incorrect code', (data && data.message) || 'Please check the code and try again.');
      }
    } catch (err) {
      Alert.alert('Could not verify', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
            <Text style={styles.headerTitle}>Customer OTP</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Customer verification</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code sent to {customerMobile || 'the customer number'}.
            </Text>

            {/* OTP Input Fields */}
            <OtpInput value={otp} onChange={setOtp} />

            {/* Resend Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Resend code in {formatTime()}
              </Text>
            </View>

            {/* Security Notice */}
            <View style={styles.noticeContainer}>
              <Image
                source={require('../../Assets/icons/shieldTick.png')}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                The code verifies consent for this transaction. Never share it with anyone else.
              </Text>
            </View>

            {/* Use Another Number Button */}
            <TouchableOpacity style={styles.alternateButton} onPress={handleBackPress}>
              <Text style={styles.alternateButtonText}>Use another number</Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip verification for now</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (otp.join('').length < 6 || verifying) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.join('').length < 6 || verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & continue</Text>
            )}
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
    // padding: 8,
    paddingHorizontal: wp('4%'),
    // width: 44,
    // height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ecececff',
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
    // tintColor: Colors.primary,
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
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F5DDC',
    textDecorationLine: 'underline',
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
