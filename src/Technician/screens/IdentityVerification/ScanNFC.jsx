import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { Colors } from '../../../Constants/Colors';

export default function ScanNFC({ onNavigate }) {
  const [scanStatus, setScanStatus] = useState('ready'); // 'ready', 'scanning', 'success'
  const [scannedData, setScannedData] = useState(null);
  const [animationValue] = useState(new Animated.Value(0));

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleSimulateScan = () => {
    setScanStatus('scanning');

    // Simulate scanning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Simulate successful scan after 3 seconds and navigate
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('nfcVerified');
      }
    }, 3000);
  };

  const handleReset = () => {
    setScanStatus('ready');
    setScannedData(null);
    animationValue.setValue(0);
  };

  const handleContinue = () => {
    if (onNavigate) {
      onNavigate('myDigitalId');
    }
  };

  const scaleAnim = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const opacityAnim = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

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
            <Text style={styles.headerTitle}>NFC Scan</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >




          {/* Main Content */}
          <View style={styles.mainContent}>
            {scanStatus === 'ready' && (
              <>
              <View style={{display: 'flex', justifyContent: 'flex-start', paddingHorizontal: wp('6%')}}>
                <Text style={styles.title}>Hold the card near your phone</Text>
                <Text style={styles.subtitle}>
                  Keep the RMTA card close to the top edge of your iPhone.
                </Text>
              </View>


                {/* NFC Icon Animation Area */}
                <View style={styles.nfcIconContainer}>
                  <Image
                    source={require('../../../Assets/icons/scanning.png')}
                    style={styles.nfcIcon}
                  />

                  <Text style={styles.readyText}>Ready to scan</Text>
                </View>



                {/* Permission Info */}
                <View style={styles.permissionBox}>
                  <Image
                    source={require('../../../Assets/icons/shieldTick.png')}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.permissionText}>
                    NFC permission is required to read a membership card.
                  </Text>
                </View>
              </>
            )}

            {scanStatus === 'scanning' && (
              <>
                <Text style={styles.title}>Scanning...</Text>

                {/* Animated NFC Icon */}
                <View style={styles.nfcIconContainer}>
                  <Animated.Image
                    source={require('../../../Assets/icons/scanning.png')}
                    style={[
                      styles.nfcIcon,
                      {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.scanningText}>Please hold the card near your phone...</Text>
              </>
            )}

            {scanStatus === 'success' && scannedData && (
              <>
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successCheckmark}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Card Verified Successfully</Text>

                  {/* Scanned Member Info */}
                  <View style={styles.memberInfoCard}>
                    <View style={styles.memberInfoRow}>
                      <Text style={styles.memberInfoLabel}>Member Name</Text>
                      <Text style={styles.memberInfoValue}>{scannedData.name}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.memberInfoRow}>
                      <Text style={styles.memberInfoLabel}>Member ID</Text>
                      <Text style={styles.memberInfoValue}>{scannedData.memberId}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.memberInfoRow}>
                      <Text style={styles.memberInfoLabel}>Organization</Text>
                      <Text style={styles.memberInfoValue}>{scannedData.organization}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.memberInfoRow}>
                      <Text style={styles.memberInfoLabel}>Status</Text>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{scannedData.status}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Rescan Option */}
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={handleReset}
                  >
                    <Text style={styles.rescanButtonText}>Scan another card</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          {scanStatus === 'ready' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSimulateScan}
            >
              <Text style={styles.primaryButtonText}>Simulate card scan</Text>
            </TouchableOpacity>
          )}

          {scanStatus === 'success' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
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
  header: {
    // backgroundColor: Colors.primary,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d4ff',
    marginBottom: hp('2%')
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dfdfdfff',
    paddingHorizontal: wp('3%'),
    paddingVertical: wp('0%'),
    borderRadius: wp('2%')
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
  stepIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  stepText: {
    color: '#D1D5DB',
    fontSize: wp('2.6%'),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    backgroundColor: '#E5E7EB',
    height: 4,
    width: '100%',
  },
  progressBar: {
    backgroundColor: Colors.primary,
    height: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    // paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    paddingBottom: hp('3%'),
  },
  mainContent: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },

  /* Ready State */
  title: {
    color: '#1F2937',
    fontSize: wp('5%'),
    fontWeight: '700',
    // textAlign: 'center',
    marginBottom: hp('1%'),
    textAlign: 'center'
  },
  subtitle: {
    color: '#6B7280',
    fontSize: wp('3%'),
    fontWeight: '400',
    // textAlign: 'center',
    marginBottom: hp('3%'),
    lineHeight: wp('4.2%'),
  },
  nfcIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: hp('0%'),
    marginHorizontal: wp('7%'),
    backgroundColor: '#EAF1FF',
    paddingVertical: hp('4%'),
    gap: wp('5%'),
    // borderWidth: 1,
    // borderColor: '#2f5ddc2a',
    borderRadius: wp('2%')
  },
  nfcIcon: {
    width: wp('26%'),
    height: wp('26%'),
    resizeMode: 'contain',
    tintColor: '#2F5DDC',
  },
  readyText: {
    color: '#2F5DDC',
    fontSize: wp('3.2%'),
    fontWeight: '600',
    textAlign: 'center',
    // marginBottom: hp('3%'),
  },
  permissionBox: {
    backgroundColor: '#EAF1FF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginTop: hp('2%'),
    marginHorizontal: wp('6%')
  },
  infoIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    tintColor: '#2F5DDC',
    marginTop: hp('0.3%'),
  },
  permissionText: {
    color: '#2F5DDC',
    fontSize: wp('2.8%'),
    fontWeight: '500',
    flex: 1,
    lineHeight: wp('4%'),
  },

  /* Scanning State */
  scanningText: {
    color: '#6B7280',
    fontSize: wp('3%'),
    fontWeight: '400',
    textAlign: 'center',
    marginTop: hp('2%'),
  },

  /* Success State */
  successContainer: {
    width: '100%',
  },
  successIcon: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: hp('2%'),
  },
  successCheckmark: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#10B981',
  },
  successTitle: {
    color: '#1F2937',
    fontSize: wp('4%'),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  memberInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('2%'),
  },
  memberInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  memberInfoLabel: {
    color: '#6B7280',
    fontSize: wp('3%'),
    fontWeight: '500',
  },
  memberInfoValue: {
    color: '#1F2937',
    fontSize: wp('3%'),
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: wp('2%'),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#6B7280',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  /* Footer */
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: hp('2%'),
  },
});
