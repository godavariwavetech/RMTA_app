import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';

export default function DeviceVerification({ onNavigate }) {
  const user = useSelector(state => state.auth.user) || {};
  const [imeiNumber, setImeiNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // The IMEI is complete once 15 digits are entered.
  const imeiComplete = imeiNumber.length === 15;

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleScanIMEI = () => {
    Alert.alert('Scan IMEI', 'Camera functionality would be implemented here');
  };

  const handleCheckIMEI = async () => {
    if (!imeiComplete || isChecking) return;
    setIsChecking(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.IMEI_CHECK, {
        member_id: user.member_id,
        imei: imeiNumber,
      });
      setIsChecking(false);
      if (response.ok && data && data.success !== false && data.data && data.data.valid) {
        // Valid IMEI → show the result screen.
        onNavigate('imeiResult', { imeiNumber });
      } else {
        Alert.alert(
          'Invalid IMEI number',
          'The IMEI you entered is not valid. Please check the 15-digit number and try again.',
        );
      }
    } catch (err) {
      setIsChecking(false);
      Alert.alert('Could not check IMEI', err.message || 'Please try again.');
    }
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Device Verification</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >


          {/* Main Content */}
          <View style={styles.content}>
            {/* Title Section */}
            <Text style={styles.mainTitle}>Know the device.</Text>
            <Text style={styles.mainTitle}>Trade with confidence.</Text>
            <Text style={styles.subtitle}>
              Check an IMEI and review device status before a transaction.
            </Text>

            {/* IMEI Input Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>IMEI number</Text>

              <View style={styles.imeiInputContainer}>
                <TextInput
                  style={styles.imeiInput}
                  placeholder="Enter IMEI number"
                  placeholderTextColor="#9CA3AF"
                  value={imeiNumber}
                  onChangeText={setImeiNumber}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>

              {imeiNumber.length > 0 && !imeiComplete && (
                <Text style={styles.imeiHint}>
                  Enter all 15 digits ({imeiNumber.length}/15)
                </Text>
              )}

              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanIMEI}
              >
                <Text style={styles.scanButtonText}>Scan IMEI</Text>
              </TouchableOpacity>
            </View>

            {/* CEIR Status Section */}
            <View style={styles.statusSection}>
              <View style={styles.statusCard}>
                <View style={styles.statusIcon}>
                  {/* <Text style={styles.shieldIcon}>🛡️</Text> */}
                  <Image source={require('../../../Assets/icons/shieldTick.png')} style={styles.shieldIcon} />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>CEIR status</Text>
                  <Text style={styles.statusDescription}>
                    Check for blacklisted or reported devices
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  {/* <Text style={styles.infoSymbol}>ℹ️</Text> */}
                  <View style={styles.statusIcon}>
                    {/* <Text style={styles.shieldIcon}>🛡️</Text> */}
                    <Image source={require('../../../Assets/icons/shieldTick.png')} style={styles.shieldIcon} />
                  </View>
                  {/* <Image source={require('../../../Assets/icons/shieldTick.png')} style={styles.shieldIcon} /> */}
                </View>
                <Text style={styles.infoText}>
                  Results shown in this prototype are sample data.
                </Text>
              </View>
            </View>

            {/* Device Info Display */}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Check Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.checkButton,
              (isChecking || !imeiComplete) && styles.checkButtonDisabled
            ]}
            onPress={handleCheckIMEI}
            disabled={isChecking || !imeiComplete}
          >
            <Text style={styles.checkButtonText}>
              {isChecking ? 'Checking...' : 'Check IMEI'}
            </Text>
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
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: hp('2%'),
  },

  /* Header */
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: hp('2%'),
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: wp('8%'),
    fontWeight: '300',
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: wp('4.2%'),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 40,
  },

  /* Content */
  content: {
    paddingHorizontal: wp('4%'),
  },

  /* Title Section */
  mainTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    fontSize: wp('3.2%'),
    color: '#9CA3AF',
    marginBottom: hp('2.5%'),
    fontWeight: '400',
  },

  /* IMEI Input Section */
  section: {
    marginBottom: hp('2.5%'),
  },
  sectionLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: hp('1%'),
  },
  imeiInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  imeiInput: {
    fontSize: wp('3.8%'),
    color: '#1F2937',
    paddingVertical: hp('1.5%'),
  },
  imeiHint: {
    fontSize: wp('3%'),
    color: '#EF4444',
    marginBottom: hp('1.5%'),
    marginTop: hp('-0.5%'),
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#616161ff',
    paddingVertical: hp('1.4%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#616161ff',
  },

  /* Status Section */
  statusSection: {
    marginBottom: hp('2.5%'),
    gap: hp('1.5%'),
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    // borderWidth: 1,
    // borderColor: '#BFDBFE',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    alignItems: 'center',
    gap: wp('3%'),
  },
  statusIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    // backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    fontSize: wp('6%'),
    height: wp('5%'),
    width: wp('5%')
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    // color: '#1E40AF',
    marginBottom: hp('0.3%'),
  },
  statusDescription: {
    fontSize: wp('2.8%'),
    color: '#6B7280',
    fontWeight: '400',
  },

  /* Info Card */
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    alignItems: 'center',
    gap: wp('2%'),
  },
  infoIcon: {
    marginTop: hp('0.3%'),
  },
  infoSymbol: {
    fontSize: wp('5%'),
  },
  infoText: {
    fontSize: wp('3%'),
    color: '#6B7280',
    fontWeight: '400',
    flex: 1,
  },

  /* Result Card */
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: hp('1.5%'),
  },
  resultCardClear: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1%'),
  },
  resultIcon: {
    fontSize: wp('6%'),
    color: '#10B981',
  },
  resultTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
  },
  resultSubtitle: {
    fontSize: wp('3%'),
    color: '#6B7280',
    marginBottom: hp('1.5%'),
    fontWeight: '400',
  },

  /* Result Details */
  resultDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('2.5%'),
    padding: wp('3%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  detailLabel: {
    fontSize: wp('3.2%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: wp('3.2%'),
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: wp('2%'),
  },
  statusGreen: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  /* Footer */
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('2%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
