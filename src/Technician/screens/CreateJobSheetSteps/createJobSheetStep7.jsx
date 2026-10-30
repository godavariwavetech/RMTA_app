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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';

import { formatDisplayDate } from '../../../Components/DatePickerModal';
import { Colors } from '../../../Constants/Colors';
import { createJobSheet } from '../../../redux/slices/jobSheetSlice';
import StepNav from '../../../Components/StepNav';

export default function CreateJobSheetStep7({ onNavigate }) {
  const dispatch = useDispatch();
  const { draft } = useSelector(state => state.jobSheet);
  const user = useSelector(state => state.auth.user) || {};
  const [submitting, setSubmitting] = useState(false);

  // Build the review summary from everything captured in steps 1–6.
  const customer = draft.customer || {};
  const device = draft.device || {};
  const repair = draft.repair || {};

  const deviceName = [device.brand, device.model].filter(Boolean).join(' ') || '—';
  const deviceSpec = [device.storage, device.color].filter(Boolean).join(' · ') || '—';
  const deviceImei = device.imei1 ? `IMEI ${device.imei1}` : 'IMEI —';

  const customerName = customer.full_name || '—';
  const customerMobile = customer.mobile || '—';
  const consentText = customer.consent ? 'OTP verified' : 'Not verified';

  const complaint = repair.problem_description || '—';
  const estimate = repair.estimated_cost || '—';
  const delivery = formatDisplayDate(repair.estimated_delivery_text) || repair.estimated_delivery_text || '—';

  // Prefer a real uploaded photo for the preview; fall back to the sample image.
  const allPhotos = [
    ...(Array.isArray(draft.photos) ? draft.photos : []),
    ...(Array.isArray(draft.conditionPhotos) ? draft.conditionPhotos : []),
  ];
  const previewPhoto = allPhotos.find(p => p && p.uri);
  const previewSource = previewPhoto
    ? { uri: previewPhoto.uri }
    : require('../../../Assets/images/sampleMobileImg.png');

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleCreateJobSheet = async () => {
    if (submitting) return;

    // The backend's condition_checks component names (step 3) → the flat
    // screen/body/camera/speaker/chargingpoint/batterey fields it expects here.
    const conditions = Array.isArray(draft.conditions) ? draft.conditions : [];
    const conditionValue = component =>
      (conditions.find(c => c && c.component === component) || {}).condition_value || '';

    // Step 3 captures exactly one photo per category — front/back/damage map
    // 1:1 onto frontimage/backimage/damageimage, sent as raw base64.
    const photos = Array.isArray(draft.photos) ? draft.photos : [];
    const photoBase64 = type => (photos.find(p => p && p.photo_type === type) || {}).base64 || null;

    const access = draft.access || {};

    const payload = {
      member_id: user.member_id,
      customer_id: customer.customer_id || null,
      device_brand: device.brand || '',
      device_model: device.model || '',
      imei1: device.imei1 || '',
      imei2: device.imei2 || '',
      color: device.color || '',
      storage: device.storage || '',
      screen: conditionValue('screen'),
      body: conditionValue('body'),
      camera: conditionValue('camera'),
      speaker: conditionValue('speaker'),
      chargingpoint: conditionValue('charging_port'),
      batterey: conditionValue('battery'),
      repair_category: repair.category || '',
      problem_description: repair.problem_description || '',
      estimated_cost: repair.estimated_cost || '',
      estimated_delivery: repair.estimated_delivery_text || '',
      devicelock: access.lock_type && access.lock_type !== 'none' ? access.unlock_value || '' : '',
      frontimage: photoBase64('front'),
      backimage: photoBase64('back'),
      damageimage: photoBase64('damage'),
    };
    setSubmitting(true);
    const result = await dispatch(createJobSheet(payload));
    setSubmitting(false);

    if (createJobSheet.fulfilled.match(result)) {
      onNavigate('resetTo', { target: 'jobs' });
    } else {
      const message =
        (result.payload && result.payload.message) ||
        'Could not create the job sheet. Please try again.';
      alert(message);
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
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Review Job Sheet</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP 6 OF 7 · REVIEW</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '85.71%' }]} />
          </View>

          {/* Device Reference Image */}
          <View style={styles.deviceReferenceContainer}>
            <Image source={previewSource} style={styles.deviceImage} />
          </View>


          {/* Content Section */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.sectionTitle}>Everything look right?</Text>
            <Text style={styles.sectionDescription}>
              Review the details before creating this job.
            </Text>

            {/* Device Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.deviceSummaryHeader}>
                <Image source={previewSource} style={styles.deviceSummaryImage} />
                <View style={styles.deviceSummaryInfo}>
                  <Text style={styles.deviceSummaryName}>{deviceName}</Text>
                  <Text style={styles.deviceSummarySpec}>{deviceSpec}</Text>
                  <Text style={styles.deviceSummaryIMEI}>{deviceImei}</Text>
                </View>
              </View>
            </View>

            {/* Customer Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Customer</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{customerName}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{customerMobile}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Consent</Text>
                <Text style={styles.detailValue}>{consentText}</Text>
              </View>
            </View>

            {/* Repair Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Repair</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Complaint</Text>
                <Text style={styles.detailValue}>{complaint}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimate</Text>
                <Text style={styles.detailValue}>{estimate}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery</Text>
                <Text style={styles.detailValue}>{delivery}</Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Create Job Sheet Button */}
        <View style={styles.buttonContainer}>
          <StepNav onPrev={handleBackPress}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateJobSheet}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create job sheet</Text>
            )}
          </TouchableOpacity>
          </StepNav>
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
   deviceReferenceContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ecececff',
    marginTop: hp('2%'),
    // width: wp('90%')
    marginHorizontal: wp('5%'),
    borderRadius: wp('3%')
  },
  deviceImage: {
    width: wp('50%'),
    height: hp('17%'),
    // resizeMode: 'contain',
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceSummaryHeader: {
    flexDirection: 'row',
    gap: wp('0%'),
    alignItems: 'center',
  },
  deviceSummaryImage: {
    width: wp('26%'),
    height: hp('6%'),
    resizeMode: 'contain',
  },
  deviceSummaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceSummaryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceSummarySpec: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  deviceSummaryIMEI: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
  createButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
