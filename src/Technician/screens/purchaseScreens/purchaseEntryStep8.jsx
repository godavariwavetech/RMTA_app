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

export default function PurchaseEntryStep8({ onNavigate, sellerData, deviceData, imeiData, ceirVerified, conditionData, priceData }) {
  const handleViewPurchaseHistory = () => {
    if (onNavigate) {
      onNavigate('viewPurchaseHistory');
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Prepare display data
  const deviceBrand = deviceData?.deviceBrand || 'Device';
  const deviceModel = deviceData?.deviceModel || '';
  const sellerName = sellerData?.sellerName || 'Anil Kumar';
  const purchasePrice = priceData?.purchasePrice || '0';

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Purchase Completed</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Success Icon and Message */}
            <View style={styles.successContainer}>
              <View style={styles.checkmarkIconContainer}>
                <Image
                  source={require('../../../Assets/icons/circle-check.png')}
                  style={styles.checkmarkIcon}
                />
              </View>
              
              <Text style={styles.successTitle}>Purchase completed</Text>
              <Text style={styles.successMessage}>
                {deviceBrand} {deviceModel} has been added to your inventory.
              </Text>
            </View>

            {/* Record Saved Status */}
            <View style={styles.recordSavedContainer}>
              <Image
                source={require('../../../Assets/icons/circle-check.png')}
                style={styles.recordSavedIcon}
              />
              <View style={styles.recordSavedContent}>
                <Text style={styles.recordSavedTitle}>Record saved</Text>
                <Text style={styles.recordSavedSubtitle}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Transaction Details */}
            <View style={styles.transactionContainer}>
              <Text style={styles.transactionTitle}>Transaction</Text>

              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Seller</Text>
                <Text style={styles.transactionValue}>{sellerName}</Text>
              </View>

              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Amount</Text>
                <Text style={styles.transactionValue}>₹{purchasePrice}</Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* View Purchase History Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleViewPurchaseHistory}
          >
            <Text style={styles.historyButtonText}>View purchase history</Text>
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
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
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
    paddingVertical: hp('3%'),
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('4%'),
    alignItems: 'center',
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkmarkIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  checkmarkIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    tintColor: '#2F5DDC',
  },
  successTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  successMessage: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  recordSavedContainer: {
    backgroundColor: '#EAF8EF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: hp('3%'),
  },
  recordSavedIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginTop: 0,
    tintColor: '#21884cff',
  },
  recordSavedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  recordSavedTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#21884cff',
    marginBottom: 4,
  },
  recordSavedSubtitle: {
    fontSize: wp('3%'),
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 18,
  },
  transactionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2.5%'),
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('2%'),
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  transactionLabel: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    fontWeight: '500',
  },
  transactionValue: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
