import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updateJobDraft } from '../../../redux/slices/jobSheetSlice';
import { isValidImei } from '../../../utils/imeiValidation';
import { useFieldNav, FieldNavBar } from '../../../Components/FieldNav';
import StepNav from '../../../Components/StepNav';

export default function CreateJobSheetStep2({ onNavigate }) {
  const nav = useFieldNav();
  const [tried, setTried] = useState(false);
  const dispatch = useDispatch();
  // Pre-fill from the saved draft so navigating back keeps what was entered.
  const draftDevice = useSelector(state => state.jobSheet.draft.device) || {};
  const [deviceBrand, setDeviceBrand] = useState(draftDevice.brand || '');
  const [deviceModel, setDeviceModel] = useState(draftDevice.model || '');
  const [imei1, setImei1] = useState(draftDevice.imei1 || '');
  const [imei2, setImei2] = useState(draftDevice.imei2 || '');
  const [color, setColor] = useState(draftDevice.color || '');
  const [storage, setStorage] = useState(draftDevice.storage || '');

  const buildDevice = () => ({
    brand: deviceBrand,
    model: deviceModel,
    imei1,
    imei2,
    color,
    storage,
  });

  const handleBackPress = () => {
    // Persist current edits so they're kept when navigating back.
    dispatch(updateJobDraft({ device: buildDevice() }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleContinue = () => {
    setTried(true);
    // Device brand, model and IMEI 1 are required.
    if (!deviceBrand.trim() || !deviceModel.trim() || !imei1.trim()) {
      Alert.alert(
        'Incomplete',
        'Please enter the device brand, device model and IMEI 1.',
      );
      return;
    }
    if (!isValidImei(imei1)) {
      Alert.alert('Invalid IMEI', 'IMEI 1 must be a valid 15-digit IMEI number.');
      return;
    }
    if (imei2.trim() && !isValidImei(imei2)) {
      Alert.alert('Invalid IMEI', 'IMEI 2 must be a valid 15-digit IMEI number.');
      return;
    }
    if (imei2.trim() && imei2 === imei1) {
      Alert.alert('Invalid IMEI', 'IMEI 2 must be different from IMEI 1.');
      return;
    }
    // Save device details into the draft.
    const device = buildDevice();
    dispatch(updateJobDraft({ device }));
    console.log('[JobSheet][Step2] device captured →', device);
    if (onNavigate) {
      onNavigate('createJobSheetStep3');
    }
  };

  const handleCheckImei = () => {
    // Placeholder for IMEI verification
    alert('IMEI verification will be performed here');
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
            <Text style={styles.headerTitle}>Device Details</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 2 OF 7 · DEVICE</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '28.57%' }]} />
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Device Brand */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Device Brand <Text style={styles.required}>*</Text>
                </Text>
                <TextInput {...nav.props(0)}
                  style={[styles.input, tried && !String(deviceBrand).trim() && styles.inputError]}
                  placeholder="Enter device brand"
                  placeholderTextColor="#D1D5DB"
                  value={deviceBrand}
                  onChangeText={setDeviceBrand}
                />
              </View>

              {/* Device Model */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Device Model <Text style={styles.required}>*</Text>
                </Text>
                <TextInput {...nav.props(1)}
                  style={[styles.input, tried && !String(deviceModel).trim() && styles.inputError]}
                  placeholder="Enter device model"
                  placeholderTextColor="#D1D5DB"
                  value={deviceModel}
                  onChangeText={setDeviceModel}
                />
              </View>

              {/* IMEI 1 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  IMEI 1 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput {...nav.props(2)}
                  style={[styles.input, tried && !String(imei1).trim() && styles.inputError]}
                  placeholder="Enter IMEI number"
                  placeholderTextColor="#D1D5DB"
                  value={imei1}
                  onChangeText={t => setImei1(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={15}
                />
                {imei1.length > 0 && !isValidImei(imei1) && (
                  <Text style={styles.imeiError}>
                    {imei1.length < 15 ? `${imei1.length}/15 digits` : 'Not a valid IMEI number'}
                  </Text>
                )}
              </View>

              {/* IMEI 2 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>IMEI 2</Text>
                <TextInput {...nav.props(3)}
                  style={styles.input}
                  placeholder="Optional"
                  placeholderTextColor="#D1D5DB"
                  value={imei2}
                  onChangeText={t => setImei2(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={15}
                />
                {imei2.length > 0 && !isValidImei(imei2) && (
                  <Text style={styles.imeiError}>
                    {imei2.length < 15 ? `${imei2.length}/15 digits` : 'Not a valid IMEI number'}
                  </Text>
                )}
              </View>

              {/* Color */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Color</Text>
                <TextInput {...nav.props(4)}
                  style={styles.input}
                  placeholder="Enter color"
                  placeholderTextColor="#D1D5DB"
                  value={color}
                  onChangeText={setColor}
                />
              </View>

              {/* Storage */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Storage</Text>
                <TextInput {...nav.props(5)}
                  style={styles.input}
                  placeholder="Enter storage capacity"
                  placeholderTextColor="#D1D5DB"
                  value={storage}
                  onChangeText={setStorage}
                />
              </View>

              {/* Check IMEI Button */}
              {/* <TouchableOpacity style={styles.checkImeiButton} onPress={handleCheckImei}>
                <Text style={styles.checkImeiButtonText}>Check IMEI</Text>
              </TouchableOpacity> */}
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Next</Text>
          </TouchableOpacity>
          </StepNav>
        </View>
      <FieldNavBar nav={nav} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  inputError: {
    borderColor: '#EF4444',
  },
  imeiError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
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
  formContainer: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkImeiButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkImeiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
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
  continueButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
