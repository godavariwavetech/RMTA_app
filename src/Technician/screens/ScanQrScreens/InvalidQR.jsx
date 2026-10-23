import React from 'react';
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

import { Colors } from '../../../Constants/Colors';

export default function InvalidQR({ onNavigate }) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleScanAgain = () => {
    if (onNavigate) {
      onNavigate('scanQR');
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
          <Text style={styles.headerTitle}>QR Invalid Member</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Error Alert */}
          <View style={styles.errorAlert}>
            <View style={styles.errorIconContainer}>
              <Image source={require('../../../Assets/icons/invalid.png')} style={styles.errorIcon} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>QR failed</Text>
              <Text style={styles.alertSubtitle}>This code is not linked to an active RMTA member.</Text>
            </View>
          </View>

          {/* Error Message Card */}
          <View style={styles.errorMessageCard}>
            <View style={styles.errorIconLarge}>
              <Image source={require('../../../Assets/icons/invalid.png')} style={styles.errorIcon} />
            </View>
            <Text style={styles.errorTitle}>Couldn't verify this member</Text>
            <Text style={styles.errorDescription}>Check the card or scan a different QR code.</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleScanAgain}
          >
            <Text style={styles.primaryButtonText}>Scan again</Text>
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
  header: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d4ff',
    marginBottom: hp('4%'),
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp('2%'),
    paddingBottom: hp('3%'),
  },

  /* Error Alert */
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginBottom: hp('3%'),
    marginHorizontal: wp('4%'),
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorIconContainer: {
    // width: wp('8%'),
    // height: wp('8%'),
    borderRadius: wp('40%'),
    // backgroundColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('2%')
  },
  errorIcon: {
    height: wp('7%'),
    width: wp('7%'),
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#DC2626',
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },
  alertSubtitle: {
    color: '#991B1B',
    fontSize: wp('2.6%'),
    fontWeight: '400',
    marginTop: hp('0.3%'),
  },

  /* Error Message Card */
  errorMessageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('4%'),
    alignItems: 'center',
    marginHorizontal: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorIconLarge: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  errorIconLargeText: {
    fontSize: wp('8%'),
  },
  errorTitle: {
    color: '#1F2937',
    fontSize: wp('4%'),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  errorDescription: {
    color: '#6B7280',
    fontSize: wp('3%'),
    fontWeight: '400',
    textAlign: 'center',
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
