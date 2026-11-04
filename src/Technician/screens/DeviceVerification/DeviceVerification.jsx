import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';

import { Colors } from '../../../Constants/Colors';
import { isValidImei } from '../../../utils/imeiValidation';
import ImeiScannerModal from '../../../Components/ImeiScannerModal';

const KYM_URL = 'https://ceir.sancharsaathi.gov.in/Device/SancharSaathiKym.jsp';
const CEIR_URL = 'https://ceir.sancharsaathi.gov.in/Device/CeirImeiVerification.jsp';

export default function DeviceVerification({ onNavigate }) {
  const [imeiNumber, setImeiNumber] = useState('');

  // The IMEI is complete once 15 digits are entered.
  const imeiComplete = imeiNumber.length === 15;
  // A 15-digit number must also pass the Luhn checksum to be a real IMEI.
  const imeiValid = isValidImei(imeiNumber);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const [scannerOpen, setScannerOpen] = useState(false);
  const handleScanIMEI = () => setScannerOpen(true);

  // Once the IMEI passes the checksum, these government pages can confirm it.
  const openLink = url => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open the link', 'Please open it in a browser: ' + url),
    );
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
              <Text style={styles.sectionLabel}>IMEI number {/* <Text style={{ color: '#EF4444' }}>*</Text> */}</Text>

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
              {imeiComplete && !imeiValid && (
                <Text style={styles.imeiHint}>This IMEI number is not valid</Text>
              )}
              {imeiValid && <Text style={styles.imeiValidHint}>✓ Valid IMEI number</Text>}

              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanIMEI}
              >
                <Text style={styles.scanButtonText}>Scan IMEI</Text>
              </TouchableOpacity>
            </View>

            {/* Device Info Display */}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        <ImeiScannerModal
          visible={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanned={imei => {
            setImeiNumber(imei);
            setScannerOpen(false);
          }}
        />

        {/* Footer: the two official checks appear once the IMEI is valid */}
        <View style={styles.footer}>
          {imeiValid ? (
            <>
              <Text style={styles.footerHeading}>Check this IMEI on Sanchar Saathi</Text>
              <TouchableOpacity
                style={styles.checkButton}
                onPress={() => openLink(KYM_URL)}
              >
                <Text style={styles.checkButtonText}>Know Your Mobile (KYM)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkButton, styles.checkButtonSecond]}
                onPress={() => openLink(CEIR_URL)}
              >
                <Text style={styles.checkButtonText}>CEIR IMEI verification</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.checkButton, styles.checkButtonDisabled]}>
              <Text style={styles.checkButtonText}>
                {imeiComplete ? 'Enter a valid IMEI' : 'Enter a 15-digit IMEI'}
              </Text>
            </View>
          )}
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
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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

  /* Info Card */

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
  footerHeading: {
    fontSize: wp('3.4%'),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp('1.2%'),
  },
  checkButtonSecond: {
    marginTop: hp('1.2%'),
    backgroundColor: '#071A3D',
  },
  imeiValidHint: {
    fontSize: wp('3.2%'),
    color: '#15803D',
    fontWeight: '600',
    marginBottom: hp('1.5%'),
    marginTop: hp('-0.5%'),
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
