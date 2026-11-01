import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import OtpInput from '../../Components/OtpInput';
import { confirmAction } from '../../utils/appModal';

export default function HandoverOTPScreen({ onNavigate }) {
  const activeJob = useSelector(state => state.jobSheet.activeJob);
  const customerMobile = (activeJob && activeJob.customer_mobile) || 'the customer';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false);
    }
  }, [timer]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('qualityCheck');
    }
  };

  const isOTPComplete = otp.every((digit) => digit !== '');

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // The server checks the OTP: POST verify_handoverotp { mobile, otp, customer_id }. An empty
  // answer means the OTP is wrong.
  const handleVerifyAndContinue = async () => {
    if (!isOTPComplete || verifying) return;
    const mobile = String((activeJob && activeJob.customer_mobile) || '').replace(/\D/g, '').slice(-10);
    setVerifying(true);
    setVerifyError('');
    try {
      const { response, data } = await postJson(ENDPOINTS.VERIFY_HANDOVER_OTP, {
        mobile,
        otp: otp.join(''),
        customer_id: activeJob && activeJob.customer_id,
      });
      const accepted =
        response.ok &&
        data &&
        data.success !== false &&
        (Array.isArray(data.data) ? data.data.length > 0 : !!data.data);
      if (!accepted) {
        setVerifyError(
          (data && data.success === false && (data.message || data.msg)) ||
            'Incorrect OTP. Please check the code and try again.',
        );
        return;
      }
    } catch (err) {
      setVerifyError(err.message || 'Could not verify the OTP. Please try again.');
      return;
    } finally {
      setVerifying(false);
    }
    if (onNavigate) {
      onNavigate('replaceStack', { target: 'handoverCompleted', base: ['home', 'jobs'] });
    }
  };

  const handleResendOTP = async () => {
    setTimer(300);
    setIsResendDisabled(true);
    setOtp(['', '', '', '', '', '']);
    const mobile = (customerMobile || '').replace(/\D/g, '');
    if (mobile.length < 10) return;
    try {
      const { response, data } = await postJson(ENDPOINTS.SEND_CUSTOMER_OTP, { mobile });
      if (response.ok && data && data.success !== false) {
        alert(
          data.otp
            ? `OTP resent to ${customerMobile}.\n\n(Dev code: ${data.otp})`
            : `OTP resent to ${customerMobile}.`,
        );
      }
    } catch (e) {
      // ignore
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <Text style={styles.headerTitle}>Handover OTP</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Confirm device handover</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code sent to {customerMobile}.
            </Text>

            {/* OTP Input Fields */}
            <OtpInput value={otp} onChange={setOtp} />

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Resend code in {formatTime(timer)}
              </Text>
            </View>

            {/* Use Another Number Button */}
            <TouchableOpacity style={styles.anotherNumberButton}>
              <Text style={styles.anotherNumberButtonText}>Use another number</Text>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              {/* <Text style={styles.securityIcon}>🔒</Text> */}
              <Image source={require('../../Assets/icons/shieldTick.png')} style={styles.tickIcon} />
              <Text style={styles.securityText}>
                This code verifies consent for this transaction. Never share it with anyone else.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          {!!verifyError && (
            <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{verifyError}</Text>
          )}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!isOTPComplete || verifying) && styles.verifyButtonDisabled,
            ]}
            onPress={() =>
              confirmAction({
                title: 'Confirm handover?',
                message: 'Verify this OTP and hand the device over to the customer.',
                confirmText: 'Verify & hand over',
                onConfirm: handleVerifyAndContinue,
              })
            }
            disabled={!isOTPComplete || verifying}
          >
            <Text style={styles.verifyButtonText}>{verifying ? 'Verifying…' : 'Verify & continue'}</Text>
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
    marginBottom: 20,
  },
  timerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  anotherNumberButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    alignItems: 'center',
  },
  anotherNumberButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#596579',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tickIcon: {
    height: hp('3%'),
    width: wp('5%')
  },
  securityIcon: {
    fontSize: 18,
  },
  securityText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
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
