import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '../../../Constants/Colors';
import { updatePurchaseDraft } from '../../../redux/slices/purchaseSlice';
import { sanitizeAmount, useFieldNav, FieldNavBar } from '../../../Components/FieldNav';
import StepNav from '../../../Components/StepNav';

export default function PurchaseEntryStep6({ onNavigate, sellerData, deviceData, imeiData, ceirVerified, conditionData }) {
  const nav = useFieldNav();
  const dispatch = useDispatch();
  const draftPrice = useSelector(state => state.purchase.draft.price) || {};
  const [purchasePrice, setPurchasePrice] = useState(draftPrice.purchasePrice || '');
  const [paymentMode, setPaymentMode] = useState(draftPrice.paymentMode || 'Cash');
  const [transactionId, setTransactionId] = useState(draftPrice.transactionId || '');

  const buildPrice = () => ({
    purchasePrice: purchasePrice,
    paymentMode: paymentMode,
    transactionId: transactionId,
  });

  const handleContinue = () => {
    const priceData = buildPrice();
    console.log('[Purchase][Step6] price captured →', priceData);
    dispatch(updatePurchaseDraft({ price: priceData }));
    if (onNavigate) {
      onNavigate('purchaseEntryStep7', {
        sellerData: sellerData,
        deviceData: deviceData,
        imeiData: imeiData,
        ceirVerified: ceirVerified,
        conditionData: conditionData,
        priceData: priceData,
      });
    }
  };

  const handleBackPress = () => {
    dispatch(updatePurchaseDraft({ price: buildPrice() }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 5;

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
            <Text style={styles.headerTitle}>Purchase Amount</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 7 · PRICE</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '71.4%' }]} />
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Agree on the amount</Text>

            {/* Purchase Price Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purchase Price</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput {...nav.props(0)}
                  style={styles.priceInput}
                  placeholder="Enter price"
                  placeholderTextColor="#9CA3AF"
                  value={purchasePrice}
                  onChangeText={t => setPurchasePrice(sanitizeAmount(t))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Payment Mode Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Mode</Text>
              <View style={styles.paymentModesContainer}>
                {['Cash', 'UPI', 'Bank transfer'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.paymentModeButton,
                      paymentMode === mode && styles.paymentModeButtonActive,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.paymentModeText,
                        paymentMode === mode && styles.paymentModeTextActive,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transaction ID Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Transaction ID</Text>
              <TextInput {...nav.props(1)}
                style={styles.input}
                placeholder="Enter Transaction ID"
                placeholderTextColor="#9CA3AF"
                value={transactionId}
                onChangeText={setTransactionId}
                editable={paymentMode !== 'Cash'}
              />
              {paymentMode === 'Cash' && (
                <Text style={styles.helperText}>Optional for cash</Text>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: hp('2.5%'),
  },
  label: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  currencySymbol: {
    fontSize: wp('4%'),
    fontWeight: '500',
    color: '#1F2937',
    marginRight: wp('2%'),
  },
  priceInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: '#1F2937',
    padding: 0,
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
  helperText: {
    fontSize: wp('3%'),
    color: '#9CA3AF',
    marginTop: hp('0.5%'),
    marginLeft: wp('1%'),
  },
  paymentModesContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    justifyContent: 'space-between',
  },
  paymentModeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModeButtonActive: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  paymentModeText: {
    fontSize: wp('3.2%'),
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentModeTextActive: {
    color: '#FFFFFF',
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
  continueButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
