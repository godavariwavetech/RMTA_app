import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Alert, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { resetSaleDraft } from '../../../redux/slices/saleSlice';
import OtpInput from '../../../Components/OtpInput';

export default function BuyerConfirmationOTP({ onNavigate, buyerData, deviceData, saleData, invoiceId }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [submitting, setSubmitting] = useState(false);

  // Request a confirmation OTP for the buyer's mobile on arrival (dev: alert).
  const sendOtp = async () => {
    const mobile = String((buyerData && buyerData.buyerMobile) || '').replace(/\D/g, '');
    if (mobile.length < 10) return;
    try {
      const { response, data } = await postJson(ENDPOINTS.SEND_CUSTOMER_OTP, { mobile });
      if (response.ok && data && data.success !== false) {
        setTimeLeft(180);
        Alert.alert(
          'Confirmation OTP sent',
          data.otp
            ? `A confirmation code was sent to ${buyerData.buyerMobile}.\n\n(Dev code: ${data.otp})`
            : `A confirmation code was sent to ${buyerData.buyerMobile}.`,
        );
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
      onNavigate('goBack');
    }
  };



  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6 || submitting) return;

    // Buyer confirmed → create the sale in the DB, then show completion.
    // deviceData.id is the purchase/inventory record's id (from
    // inventory_list / search_purchase), used here as purchase_id.
    const payload = {
      member_id: user.member_id,
      purchase_id: deviceData?.id,
      buyer_id: buyerData?.customer_id,
      sale_price: saleData?.salePrice || '0',
      payment_mode: saleData?.paymentMode || 'cash',
      warranty_notes: saleData?.warranty || null,
    };
    console.log(
      `[Sale][Confirm] create_sale_sheets POST ${ENDPOINTS.CREATE_SALE} payload →`,
      payload,
    );
    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_SALE, payload);
      console.log(
        `[Sale][Confirm] create_sale_sheets response → HTTP ${response.status}`,
        data,
      );
      setSubmitting(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert('Could not complete sale', (data && data.message) || 'Please try again.');
        return;
      }
      dispatch(resetSaleDraft());
      if (onNavigate) {
        onNavigate('replaceStack', {
          target: 'saleCompleted',
          screenParams: {
            buyerData: buyerData,
            deviceData: deviceData,
            saleData: saleData,
            invoiceId: invoiceId,
            sale: data.data,
            otpVerified: true,
          },
        });
      }
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not complete sale', err.message);
    }
  };

  const handleUseAnotherNumber = () => {
    if (onNavigate) {
      onNavigate('goBackTo', { target: 'saleEntryStep1' });
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const buyerMobile = buyerData?.buyerMobile || '+91 98765 43210';
  const completedSteps = 5;

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
            <Text style={styles.headerTitle}>Confirm Sale</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 6 · CONFIRMATION</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '83.33%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Buyer handover confirmation</Text>
            <Text style={styles.sectionDescription}>
              Enter the 6-digit code sent to {buyerMobile}.
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
              (otp.join('').length < 6 || submitting) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.join('').length < 6 || submitting}
          >
            {submitting ? (
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
  stepIndicator: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F5DDC',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp('5%'),
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: hp('2%'),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F5DDC',
    borderRadius: 2,
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
