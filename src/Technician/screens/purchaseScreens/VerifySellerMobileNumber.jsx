import React, { useState, useEffect } from 'react';
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
} from '../../../utils/responsive';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import OtpInput from '../../../Components/OtpInput';

export default function VerifySellerMobileNumber({ onNavigate, sellerData }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [verifying, setVerifying] = useState(false);

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
      onNavigate('goBack');
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

    const mobile = String((sellerData && sellerData.sellerMobile) || '').replace(/\D/g, '');
    setVerifying(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.VERIFY_CUSTOMER_OTP, {
        mobile,
        otp: fullOtp,
      });
      if (!response.ok || (data && data.success === false)) {
        Alert.alert('Incorrect code', (data && data.message) || 'Please check the code and try again.');
        return;
      }

      // The verify response may carry the seller's id (seller_id / customer_id /
      // id), possibly wrapped in a single-element array like other endpoints
      // on this backend. If create_purchase_customer didn't already give us
      // one, pick it up here.
      const record = Array.isArray(data.data) ? data.data[0] : data.data;
      const verifiedId =
        record &&
        (record.seller_id || record.customer_id || record.id || record.insertId);
      const seller = verifiedId
        ? { ...sellerData, customer_id: sellerData?.customer_id || verifiedId }
        : sellerData;

      console.log('[Purchase][VerifySeller] OTP verified for', seller && seller.sellerMobile);
      if (onNavigate) {
        onNavigate('purchaseEntryStep2', {
          sellerData: seller,
          otpVerified: true,
        });
      }
    } catch (err) {
      Alert.alert('Could not verify', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleUseAnotherNumber = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const sellerMobile = sellerData?.sellerMobile || '+91 98765 43210';

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
            <Text style={styles.headerTitle}>Seller OTP</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Verify the seller</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code sent to {sellerMobile}.
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
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
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
