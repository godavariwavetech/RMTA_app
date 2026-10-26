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
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { resetPurchaseDraft } from '../../../redux/slices/purchaseSlice';

export default function PurchaseEntryStep7({ onNavigate, sellerData, deviceData, imeiData, ceirVerified, conditionData, priceData }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const draftConditionPhotos = useSelector(state => state.purchase.draft.conditionPhotos);
  const [submitting, setSubmitting] = useState(false);

  // Collapse all the screens' data into the flat payload create_purchase expects.
  const buildPayload = () => {
    const now = new Date().toISOString();
    const conditionPhotos = Array.isArray(draftConditionPhotos) ? draftConditionPhotos : [];
    return {
      member_id: user.member_id,
      seller_id: sellerData?.customer_id || null,
      device_brand: deviceData?.deviceBrand || '',
      device_model: deviceData?.deviceModel || '',
      imei1: imeiData?.imei || '',
      imei2: '',
      color: deviceData?.color || '',
      storage: deviceData?.storage || '',
      screen: conditionData?.screen || '',
      body: conditionData?.body || '',
      camera: conditionData?.camera || '',
      speaker: conditionData?.speaker || '',
      chargingport: conditionData?.chargingPort || '',
      batterey: conditionData?.battery || '',
      // frontimage = step 2's device photo, backimage = step 5's first
      // condition photo — both sent as raw base64.
      frontimage: (deviceData?.devicePhoto && deviceData.devicePhoto.base64) || null,
      backimage: (conditionPhotos[0] && conditionPhotos[0].base64) || null,
      purchaseprice: priceData?.purchasePrice || '0',
      paymentmode: priceData?.paymentMode || 'Cash',
      transactionid: priceData?.transactionId || '',
      purchase_date: now,
      created_date: now,
    };
  };

  const handleCompletePurchase = async () => {
    if (submitting) return;
    const payload = buildPayload();
    console.log('[Purchase][Step7] submitting full payload →', JSON.stringify(payload, null, 2));
    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_PURCHASE, payload);
      setSubmitting(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert('Could not complete purchase', (data && data.message) || 'Please try again.');
        return;
      }
      // Unwrap in case this endpoint also wraps the record in an array.
      const purchase = Array.isArray(data.data) ? data.data[0] : data.data;
      console.log('[Purchase][Step7] created ✓ →', purchase);
      dispatch(resetPurchaseDraft());
      if (onNavigate) {
        onNavigate('purchaseEntryStep8', {
          sellerData, deviceData, imeiData, ceirVerified, conditionData, priceData,
          purchase,
        });
      }
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not complete purchase', err.message);
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('purchaseEntryStep6');
    }
  };

  const completedSteps = 7;

  // Prepare display data
  const deviceBrand = deviceData?.deviceBrand || 'Device';
  const deviceModel = deviceData?.deviceModel || '';
  const storage = deviceData?.storage || '';
  const color = deviceData?.color || '';
  const imei = imeiData?.imei || '';
  const sellerName = sellerData?.sellerName || '';
  const purchasePrice = priceData?.purchasePrice || '0';
  const paymentMode = priceData?.paymentMode || 'Cash';

  // Show the photo captured in step 2 (its local uri is still valid in-session);
  // fall back to the sample image if no photo was taken.
  const devicePhotoUri = deviceData?.devicePhoto?.uri || null;
  const deviceImageSource = devicePhotoUri
    ? { uri: devicePhotoUri }
    : require('../../../Assets/images/sampleMobileImg.png');

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
            <Text style={styles.headerTitle}>Review Purchase</Text>
            <View style={styles.placeholderButton} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 8 · REVIEW</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '87.5%' }]} />
          </View>

          {/* Device Image Section */}
          <View style={styles.deviceImageSection}>
            <Image
              source={deviceImageSource}
              style={styles.deviceImage}
            />
          </View>


          {/* Form Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Review your purchase</Text>

            {/* Device Card */}
            <View style={styles.deviceCard}>
                <Image
                source={deviceImageSource}
                style={styles.deviceImageSmall}
                />
                <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{deviceBrand} {deviceModel}</Text>
                <Text style={styles.deviceDetails}>
                    {storage}
                    {storage && color ? ' · ' : ''}
                    {color}
                </Text>
                <Text style={styles.deviceImei}>IMEI {imei}</Text>
                </View>
            </View>

            {/* Purchase Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Purchase summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seller</Text>
                <Text style={styles.summaryValue}>{sellerName}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IMEI</Text>
                <Text style={styles.summaryValue}>{imei}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Purchase price</Text>
                <Text style={styles.summaryValue}>₹{purchasePrice}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment mode</Text>
                <Text style={styles.summaryValue}>{paymentMode}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seller consent</Text>
                <Text style={styles.summaryValue}>OTP verified</Text>
              </View>
            </View>

            {/* CEIR Verified Status */}
            {ceirVerified && (
              <View style={styles.statusContainer}>
                <Image
                  source={require('../../../Assets/icons/circle-check.png')}
                  style={styles.statusIcon}
                />
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>CEIR verified</Text>
                  <Text style={styles.statusSubtitle}>Device check recorded</Text>
                </View>
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Complete Purchase Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompletePurchase}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Complete purchase</Text>
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
  deviceImageSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('6%'),
    borderWidth: 1,
    borderColor: '#ddddddff',
    borderRadius: wp('4%')
  },
  deviceImage: {
    width: wp('65%'),
    height: hp('15%'),
    resizeMode: 'contain',
  },

  deviceImageSmall: {
    width: wp('28%'),
    height: hp('7%'),
    resizeMode: 'contain',
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 16,
    marginBottom: hp('2.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceCardImage: {
    width: wp('28%'),
    height: hp('7%'),
    resizeMode: 'contain',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: wp('3%'),
    color: '#6B7280',
    marginBottom: 4,
  },
  deviceImei: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: wp('3.2%'),
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  statusContainer: {
    backgroundColor: '#EAF8EF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: hp('2%'),
  },
  statusIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginTop: 0,
    tintColor: '#21884cff',
  },
  statusContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#21884cff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: wp('3%'),
    color: '#6B7280',
    fontWeight: '400',
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
  completeButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
