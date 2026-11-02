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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { resetPassword } from '../../redux/slices/authSlice';

export default function ForgotPassStep3({ onNavigate, mobile, otp }) {
  const dispatch = useDispatch();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleSaveNewPassword = async () => {
    if (!onNavigate || saving) return;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      alert('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSaving(true);
    const result = await dispatch(
      resetPassword({ mobile, otp, new_password: newPassword }),
    );
    setSaving(false);

    if (resetPassword.fulfilled.match(result)) {
      Alert.alert(
        'Password updated',
        'Your password has been changed successfully. Please sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => onNavigate('login', { loginMode: 'admin' }),
          },
        ],
      );
    } else {
      const message =
        (result.payload && result.payload.message) ||
        'Could not reset password. Please try again.';
      alert(message);
    }
  };

  const isPasswordValid = () => {
    return newPassword.trim() !== '' && confirmPassword.trim() !== '';
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
          {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>New password</Text>
              <View style={styles.placeholderButton} />
            </View>
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
          >


            {/* Main Title */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Create a new password</Text>
              <Text style={styles.subtitle}>
                Use at least 8 characters, including a number and a symbol.
              </Text>
            </View>

            {/* New Password Field */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>New password <Text style={styles.required}>*</Text></Text>
              <View style={styles.passwordFieldContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Image
                    source={
                      showNewPassword
                        ? require('../../Assets/icons/eyeOpen.png')
                        : require('../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Confirm new password <Text style={styles.required}>*</Text></Text>
              <View style={styles.passwordFieldContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Image
                    source={
                      showConfirmPassword
                        ? require('../../Assets/icons/eyeOpen.png')
                        : require('../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Out Other Devices Checkbox */}
            <View style={styles.checkboxSection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setSignOutOtherDevices(!signOutOtherDevices)}
              >
                <View
                  style={[
                    styles.checkbox,
                    signOutOtherDevices && styles.checkboxChecked,
                  ]}
                >
                  {signOutOtherDevices && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>Sign out of other devices</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Save New Password Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!isPasswordValid() || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveNewPassword}
              disabled={!isPasswordValid() || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save new password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  required: {
    color: '#EF4444',
  },
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
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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

  /* Field Section */
  fieldSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  fieldLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.8%'),
  },
  passwordFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp('3%'),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    fontSize: wp('3.8%'),
    color: '#1F2937',
  },
  eyeButton: {
    padding: wp('2%'),
  },
  eyeIcon: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#9CA3AF',
  },

  /* Checkbox Section */
  checkboxSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('1%'),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkmark: {
    fontSize: wp('3%'),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkboxText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
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
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
