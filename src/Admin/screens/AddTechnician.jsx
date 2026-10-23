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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { addTechnician } from '../../redux/slices/techniciansSlice';

// Admin-only screen to add a technician. Collects the same profile details as
// admin registration (RegisterScreen) plus an active/inactive status. Posts to
// POST /public_app/add_technician (role forced to 'technician', account created
// active) so the technician can immediately log in via the Technician tab with
// the mobile + password the admin sets here.
export default function AddTechnician({ onNavigate }) {
  const dispatch = useDispatch();

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
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleAdd = async () => {
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

    // Validate required inputs (mirrors RegisterScreen).
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

    const mobile = mobileNumber.replace(/\D/g, '');
    if (mobile.length < 10) {
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

    // Field names match what POST /public_app/add_technician reads.
    // technician_status is NOT sent — the backend creates every technician as
    // 'inactive'; the technician activates themselves from their home screen.
    const payload = {
      full_name: fullName.trim(),
      mobile,
      shop_name: shopName.trim(),
      address: shopAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      password,
    };

    setSubmitting(true);
    const result = await dispatch(addTechnician(payload));
    setSubmitting(false);

    if (addTechnician.fulfilled.match(result)) {
      Alert.alert(
        'Technician added',
        `${payload.full_name} can now log in with mobile ${mobile} and the password you set.`,
        [{ text: 'OK', onPress: () => onNavigate('goBack') }],
      );
    } else {
      const message =
        (result.payload && result.payload.message) ||
        'Could not add technician. Please try again.';
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Technician</Text>
            <View style={styles.placeholderButton} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >
            <Text style={styles.subtitle}>
              Enter the technician's details. They'll log in from the Technician
              tab using the mobile number and password you set here.
            </Text>

            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Technician name"
                  placeholderTextColor="#999999"
                  value={form.fullName}
                  onChangeText={text => updateField('fullName', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Number */}
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
                  maxLength={14}
                />
              </View>
            </View>

            {/* Shop / Business Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Shop / Business name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop name"
                  placeholderTextColor="#999999"
                  value={form.shopName}
                  onChangeText={text => updateField('shopName', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Shop Address */}
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

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Set a password (min 6 chars)"
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
                        ? require('../../Assets/icons/eyeOpen.png')
                        : require('../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
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
                        ? require('../../Assets/icons/eyeOpen.png')
                        : require('../../Assets/icons/eyeClose.png')
                    }
                    style={styles.eyeIconImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add Technician</Text>
              )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  subtitle: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    lineHeight: hp('2.3%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
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
  addButton: {
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
  addButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
