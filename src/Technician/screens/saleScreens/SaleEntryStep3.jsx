import React, { useState } from 'react';
import { useScreenBack } from '../../../utils/screenBack';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { updateSaleDraft, resetSaleDraft } from '../../../redux/slices/saleSlice';
import { sanitizeAmount, useFieldNav, FieldNavBar } from '../../../Components/FieldNav';
import StepNav from '../../../Components/StepNav';

export default function SaleEntryStep3({ onNavigate, buyerData, deviceData }) {
  const nav = useFieldNav();
  const [tried, setTried] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  // Fall back to the Redux draft when buyerData/deviceData weren't passed in
  // nav params (e.g. navigating back from step 4, which doesn't re-send them).
  const draft = useSelector(state => state.sale.draft) || {};
  const buyer = buyerData || draft.buyer || {};
  const device = deviceData || draft.device || {};
  const draftSale = draft.sale || {};
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    salePrice: draftSale.salePrice || '',
    paymentMode: draftSale.paymentMode || 'cash', // 'cash', 'upi', 'bank'
    transactionId: draftSale.transactionId || '',
    warranty: draftSale.warranty || '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      paymentMode: mode,
    }));
    // Clear transaction ID when switching to cash
    if (mode === 'cash') {
      setFormData(prev => ({
        ...prev,
        transactionId: '',
      }));
    }
  };

  const handleCreateInvoice = async () => {
    if (!onNavigate || submitting) return;
    setTried(true);
    dispatch(updateSaleDraft({ sale: formData }));

    // deviceData.id is the purchase/inventory record's id (from
    // inventory_list / search_purchase), used here as purchase_id.
    const payload = {
      member_id: user.member_id,
      purchase_id: device?.id,
      buyer_id: buyer?.customer_id,
      sale_price: formData.salePrice || '0',
      payment_mode: formData.paymentMode || 'cash',
      warranty_notes: formData.warranty || null,
    };
    console.log(
      `[Sale][Step3] create_sale_sheets POST ${ENDPOINTS.CREATE_SALE} payload →`,
      payload,
    );
    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_SALE, payload);
      console.log(
        `[Sale][Step3] create_sale_sheets response → HTTP ${response.status}`,
        data,
      );
      setSubmitting(false);
      if (!response.ok || (data && data.success === false)) {
        Alert.alert('Could not complete sale', (data && data.message) || 'Please try again.');
        return;
      }
      dispatch(resetSaleDraft());
      onNavigate('saleEntryStep4', {
        buyerData: buyer,
        deviceData: device,
        saleData: formData,
        sale: data.data,
      });
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not complete sale', err.message);
    }
  };

  // Android system back runs the same save-draft-then-go-back as the Back button.
  useScreenBack(() => handleBackPress());
  const handleBackPress = () => {
    dispatch(updateSaleDraft({ sale: formData }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 3;
  const deviceTitle = `${device.brand || 'Device'} ${device.model || ''}`;
  const deviceSubtitle = `${device.storage || ''} - ${device.color || ''}`;
  const deviceImei = device.imei || '';

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
            <Text style={styles.headerTitle}>Sale Details</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 6 · DETAILS</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Device Summary Card */}
            <View style={styles.deviceCard}>
              <Image
                source={device.deviceImage}
                style={styles.deviceImage}
              />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceTitle}>{deviceTitle}</Text>
                <Text style={styles.deviceSubtitle}>{deviceSubtitle}</Text>
                <Text style={styles.deviceImei}>IMEI {deviceImei}</Text>
              </View>
            </View>

            {/* Sale Price Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Sale Price {/* <Text style={styles.required}>*</Text> */}
              </Text>
              <View style={[styles.priceInputContainer, tried && !(Number(formData.salePrice) > 0) && styles.inputError]}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput {...nav.props(0)}
                  style={styles.priceInput}
                  placeholder="21,000"
                  placeholderTextColor="#9CA3AF"
                  value={formData.salePrice}
                  onChangeText={(value) => handleInputChange('salePrice', sanitizeAmount(value))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Payment Mode Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Payment Mode {/* <Text style={styles.required}>*</Text> */}
              </Text>
              <View style={styles.paymentModeContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentModeButton,
                    formData.paymentMode === 'cash' && styles.paymentModeButtonActive,
                  ]}
                  onPress={() => handlePaymentModeChange('cash')}
                >
                  <Text
                    style={[
                      styles.paymentModeText,
                      formData.paymentMode === 'cash' && styles.paymentModeTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentModeButton,
                    formData.paymentMode === 'upi' && styles.paymentModeButtonActive,
                  ]}
                  onPress={() => handlePaymentModeChange('upi')}
                >
                  <Text
                    style={[
                      styles.paymentModeText,
                      formData.paymentMode === 'upi' && styles.paymentModeTextActive,
                    ]}
                  >
                    UPI
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentModeButton,
                    formData.paymentMode === 'bank' && styles.paymentModeButtonActive,
                  ]}
                  onPress={() => handlePaymentModeChange('bank')}
                >
                  <Text
                    style={[
                      styles.paymentModeText,
                      formData.paymentMode === 'bank' && styles.paymentModeTextActive,
                    ]}
                  >
                    Bank transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transaction ID Field - Show only for UPI and Bank */}
            {(formData.paymentMode === 'upi' || formData.paymentMode === 'bank') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Transaction ID {/* <Text style={styles.required}>*</Text> */}
                </Text>
                <TextInput {...nav.props(1)}
                  style={[styles.input, tried && !String(formData.transactionId || '').trim() && styles.inputError]}
                  placeholder={formData.paymentMode === 'upi' ? 'UPI Transaction ID' : 'Bank Reference Number'}
                  placeholderTextColor="#9CA3AF"
                  value={formData.transactionId}
                  onChangeText={(value) => handleInputChange('transactionId', value)}
                />
              </View>
            )}

            {/* Optional for Cash Message */}
            {/* {formData.paymentMode === 'cash' && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Optional for cash</Text>
              </View>
            )} */}

            {/* Warranty / Sale Notes Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Warranty / sale notes</Text>
              <TextInput {...nav.props(2)}
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                placeholder="e.g., 7-day service support, 1-year warranty, etc."
                placeholderTextColor="#9CA3AF"
                value={formData.warranty}
                onChangeText={(value) => handleInputChange('warranty', value)}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Create Invoice Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={[
              styles.createInvoiceButton,
              submitting && styles.createInvoiceButtonDisabled,
            ]}
            onPress={handleCreateInvoice}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createInvoiceButtonText}>Create invoice</Text>
            )}
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
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('2.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceImage: {
    width: wp('26%'),
    height: wp('14%'),
    resizeMode: 'contain',
    // marginRight: wp('3%'),
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  deviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: hp('0.2%'),
  },
  deviceImei: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  formGroup: {
    marginBottom: hp('2%'),
  },
  label: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp('0.8%'),
  },
  required: {
    color: '#EF4444',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  currencySymbol: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginRight: wp('2%'),
  },
  priceInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#1F2937',
  },
  textArea: {
    paddingVertical: hp('1.2%'),
    minHeight: hp('12%'),
  },
  paymentModeContainer: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  paymentModeButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentModeText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  paymentModeTextActive: {
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('2%'),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: wp('3%'),
    color: '#0284C7',
    fontWeight: '500',
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
  createInvoiceButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  createInvoiceButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createInvoiceButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
