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

export default function SaleCompleted({ onNavigate, buyerData, deviceData, saleData, invoiceId }) {
  const handleViewSaleHistory = () => {
    if (onNavigate) {
      onNavigate('viewSaleHistory');
    }
  };

  const handleBackToHome = () => {
    if (onNavigate) {
      onNavigate('resetTo', { target: 'home' });
    }
  };

  const deviceTitle = `${deviceData?.brand || 'Device'} ${deviceData?.model || ''}`;
  const buyerName = buyerData?.buyerName || 'N/A';

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
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sale Completed</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Content */}
          <View style={styles.content}>
            {/* Success Card */}
            <View style={styles.successCard}>
              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>

              {/* Success Message */}
              <Text style={styles.successTitle}>Sale completed</Text>
              <Text style={styles.successMessage}>
                The buyer has confirmed receipt. Your invoice is ready.
              </Text>
            </View>

            {/* Record Saved Card */}
            <View style={styles.recordSavedCard}>
              {/* <View style={styles.recordSavedIconContainer}>
                <Text style={styles.recordSavedIcon}>✓</Text>
              </View> */}
              <Image source={require('../../../Assets/icons/shieldTick.png')} style={styles.recordSavedIcon} />
              <View style={styles.recordSavedContent}>
                <Text style={styles.recordSavedTitle}>Record saved</Text>
                <Text style={styles.recordSavedSubtitle}>
                  Your receipt and transaction details are ready.
                </Text>
              </View>
            </View>

            {/* Sale Receipt Section */}
            <View style={styles.receiptSection}>
              <Text style={styles.receiptTitle}>Sale receipt</Text>

              {/* Receipt Details */}
              <View style={styles.receiptCard}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Invoice</Text>
                  <Text style={styles.receiptValue}>{invoiceId}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Buyer</Text>
                  <Text style={styles.receiptValue}>{buyerName}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Device</Text>
                  <Text style={styles.receiptValue}>{deviceTitle}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount</Text>
                  <Text style={styles.receiptValue}>₹{saleData?.salePrice}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewHistoryButton}
            onPress={handleViewSaleHistory}
          >
            <Text style={styles.viewHistoryButtonText}>View sale history</Text>
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
    paddingVertical: hp('2%'),
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  successIcon: {
    fontSize: 32,
    color: '#2F5DDC',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  recordSavedCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('2.5%'),
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    gap: wp('4%')
  },
//   recordSavedIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#D1FAE5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: wp('3%'),
//   },
  recordSavedIcon: {
    height: hp('3%'),
    width: wp('7%'),
    tintColor: '#059669',
    fontWeight: '700',
  },
  recordSavedContent: {
    flex: 1,
  },
  recordSavedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: hp('0.3%'),
  },
  recordSavedSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  receiptSection: {
    marginBottom: hp('2%'),
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
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
  viewHistoryButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewHistoryButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
