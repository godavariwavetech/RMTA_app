import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { sendForgotOtp } from '../../redux/slices/authSlice';

export default function ForgotPassStep1({ onNavigate }) {
  const dispatch = useDispatch();
  const [mobileNumber, setMobileNumber] = useState('');
  const [sending, setSending] = useState(false);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!onNavigate) return;
    const mobile = mobileNumber.replace(/\D/g, '');
    if (mobile.length < 10) {
      alert('Please enter a valid mobile number');
      return;
    }

    setSending(true);
    const result = await dispatch(sendForgotOtp({ mobile }));
    setSending(false);

    if (sendForgotOtp.fulfilled.match(result)) {
      // DEV: no SMS gateway, so the OTP is returned in the response. Showing it
      // here makes the flow testable on-device. Remove once real SMS is wired.
      const devOtp = result.payload && result.payload.otp;
      Alert.alert(
        'OTP sent',
        devOtp
          ? `A verification code was sent to your number.\n\n(Dev code: ${devOtp})`
          : 'A verification code was sent to your number.',
        [{ text: 'OK', onPress: () => onNavigate('forgotPassStep2', { mobile }) }],
      );
    } else {
      const message =
        (result.payload && result.payload.message) ||
        'Could not send the code. Please try again.';
      alert(message);
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
              <Text style={styles.headerTitle}>Reset password</Text>
              <View style={styles.placeholderButton} />
            </View>

            {/* Main Title */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Let's get you back in.</Text>
              <Text style={styles.subtitle}>
                We'll send a verification code to your registered mobile number.
              </Text>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.mobileSection}>
              <Text style={styles.mobileLabel}>Registered mobile number</Text>
              <View style={styles.mobileNumberContainer}>
                <TextInput
                  style={styles.mobileNumber}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  maxLength={14}
                />
              </View>
            </View>

            {/* Security Info */}
            <View style={styles.securitySection}>
              <View style={styles.securityIconContainer}>
                <Text style={styles.securityIcon}>🔒</Text>
              </View>
              <Text style={styles.securityText}>
                Your account stays secure. We will never ask for your password by phone.
              </Text>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Send Verification Code Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendVerificationCode}
              disabled={sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? 'Sending…' : 'Send verification code'}
              </Text>
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

  /* Mobile Section */
  mobileSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  mobileLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  mobileNumberContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.7%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mobileNumber: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
  },

  /* Security Section */
  securitySection: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('3%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
  },
  securityIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  securityIcon: {
    fontSize: wp('5%'),
  },
  securityText: {
    flex: 1,
    fontSize: wp('3.2%'),
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: hp('2.2%'),
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
  sendButton: {
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
  sendButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
