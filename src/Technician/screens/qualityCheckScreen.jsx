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
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';

export default function QualityCheckScreen({ onNavigate }) {
  const user = useSelector(state => state.auth.user) || {};
  const activeJob = useSelector(state => state.jobSheet.activeJob);
  const [marking, setMarking] = useState(false);
  const [checkedItems, setCheckedItems] = useState({
    display: false,
    touch: false,
    camera: false,
    speaker: false,
    microphone: false,
    charging: false,
    wifi: false,
    bluetooth: false,
    fingerprint: false,
    battery: false,
  });

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('repairProgress');
    }
  };

  const handleMarkReadyForHandover = async () => {
    if (marking) return;
    if (!activeJob || !activeJob.id) {
      Alert.alert('No active job', 'Open a job and start repair first.');
      return;
    }
    setMarking(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.MARK_JOB_READY, {
        job_id: activeJob.id,
        user_id: user.user_id,
      });
      setMarking(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert('Could not mark ready', (data && data.message) || 'Please try again.');
        return;
      }
      // DEV: no SMS gateway — show the handover OTP in an alert, then continue.
      const otp = data.otp;
      Alert.alert(
        'Ready for handover',
        otp
          ? `A handover OTP was sent to ${data.data.customer_mobile || 'the customer'}.\n\n(Dev code: ${otp})`
          : 'A handover OTP was sent to the customer.',
        [{ text: 'OK', onPress: () => onNavigate && onNavigate('handoverOTP') }],
      );
    } catch (err) {
      setMarking(false);
      Alert.alert('Could not mark ready', err.message);
    }
  };

  const toggleCheckbox = (item) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const qualityCheckItems = [
    { id: 'display', label: 'Display' },
    { id: 'touch', label: 'Touch' },
    { id: 'camera', label: 'Camera' },
    { id: 'speaker', label: 'Speaker' },
    { id: 'microphone', label: 'Microphone' },
    { id: 'charging', label: 'Charging' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'bluetooth', label: 'Bluetooth' },
    { id: 'fingerprint', label: 'Fingerprint' },
    { id: 'battery', label: 'Battery' },
  ];

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
            <Text style={styles.headerTitle}>Quality Check</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Ready for the customer?</Text>
            <Text style={styles.sectionDescription}>
              Complete all checks before handover.
            </Text>

            {/* Checkboxes Container */}
            <View style={styles.checkboxesContainer}>
              {qualityCheckItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkboxItem}
                  onPress={() => toggleCheckbox(item.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checkedItems[item.id] && styles.checkboxChecked,
                    ]}
                  >
                    {checkedItems[item.id] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Mark Ready Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.readyButton}
            onPress={handleMarkReadyForHandover}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.readyButtonText}>Mark ready for handover</Text>
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
    marginBottom: 24,
  },
  checkboxesContainer: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
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
  readyButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
