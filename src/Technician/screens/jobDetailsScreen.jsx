import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { useSelector, useDispatch } from 'react-redux';
import { SkeletonDetails } from '../../Components/Skeleton';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS, BASE_URL } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { confirmAction } from '../../utils/appModal';
import { setActiveJob } from '../../redux/slices/jobSheetSlice';

const STATUS_META = {
  draft: { label: 'Draft', color: '#9CA3AF', bg: '#F3F4F6' },
  open: { label: 'Active', color: '#1D4ED8', bg: '#DBEAFE' },
  in_progress: { label: 'In progress', color: '#D97706', bg: '#FEF3C7' },
  waiting_parts: { label: 'Waiting parts', color: '#B45309', bg: '#FEF3C7' },
  quality_check: { label: 'Quality check', color: '#6D28D9', bg: '#EDE9FE' },
  ready: { label: 'Ready', color: '#1D4ED8', bg: '#DBEAFE' },
  completed: { label: 'Completed', color: '#15803D', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#B91C1C', bg: '#FEE2E2' },
};

const LOCK_LABEL = { none: 'No lock', password: 'Password', pattern: 'Pattern' };

export default function JobDetailsScreen({ onNavigate, jobId, jobSummary }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState('overview');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the full record couldn't be loaded.
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [starting, setStarting] = useState(false);
  // Handover OTP: `expectedOtp` is what handover_repair returned; the
  // technician types the one the customer received and we compare them.
  const [otpVisible, setOtpVisible] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    let active = true;

    // If the details API fails, use the main job list API: prefer the row we
    // were opened with, otherwise look the job up in get_job_sheets.
    const fallbackFromList = async () => {
      if (jobSummary) return jobSummary;
      try {
        const { response, data } = await postJson(ENDPOINTS.GET_JOB_SHEETS, {
          member_id: user.member_id,
        });
        if (response.ok && data && Array.isArray(data.data)) {
          return data.data.find(row => String(row.id) === String(jobId)) || null;
        }
      } catch (e) {
        // nothing more to try
      }
      return null;
    };

    (async () => {
      if (!jobId) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const { response, data } = await postJson(ENDPOINTS.JOB_SHEET_DETAILS, {
          job_id: jobId,
        });
        if (!active) return;
        // Log the response with long values (e.g. base64) truncated.
        console.log(
          `[jobDetails] job_id=${jobId} HTTP ${response.status}:`,
          JSON.stringify(data, (k, v) =>
            typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}...(${v.length})` : v,
          2),
        );
        if (response.ok && data && data.success !== false) {
          setJob(data.data);
        } else {
          console.log('[jobDetails] request failed:', response.status, data && data.message);
          setLoadError((data && data.message) || `Could not load this job (${response.status}).`);
          // Fall back to the main list API so the screen isn't empty.
          const row = await fallbackFromList();
          if (active && row) setJob(row);
        }
      } catch (e) {
        console.log('[jobDetails] request error:', e.message);
        if (active) {
          setLoadError('Could not reach the server. Check your connection and try again.');
          const row = await fallbackFromList();
          if (active && row) setJob(row);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, reloadKey]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('jobs');
    }
  };

  // Repair stages, driven by the server's `completed_status`:
  //   0 → "Start repair"      (sends 1)
  //   1 → "Completed repair"  (sends 2)
  //   2 → "Handover"          (sends 3)
  //   3 → finished, no button
  const REPAIR_STAGES = {
    0: { label: 'Start repair', next: 1 },
    1: { label: 'Completed repair', next: 2 },
    2: { label: 'Handover', next: 3 },
  };

  const handleAdvanceStatus = async nextStatus => {
    // The job's id comes from the list row (jobSummary.id), falling back to
    // the id this screen was opened with.
    const targetJobId = (jobSummary && jobSummary.id) || jobId;
    if (!targetJobId || starting) return;
    const payload = {
      member_id: user.member_id,
      job_id: targetJobId,
      completed_status: nextStatus,
    };
    setStarting(true);
    try {
      console.log('[repairStatus] request →', payload);
      const { response, data } = await postJson(ENDPOINTS.START_REPAIR, payload);
      console.log('[repairStatus] response →', response.status, JSON.stringify(data));
      if (!response.ok || (data && data.success === false)) {
        alert((data && data.message) || 'Could not update the repair status. Please try again.');
        return;
      }
      // Trust the status the server returns; fall back to what we sent.
      const returned =
        data && data.data && data.data.completed_status != null
          ? Number(data.data.completed_status)
          : data && data.completed_status != null
          ? Number(data.completed_status)
          : nextStatus;
      setJob(prev => ({ ...(prev || {}), completed_status: returned }));
      dispatch(
        setActiveJob({
          id: targetJobId,
          job_code: j.job_code,
          customer_mobile: j.customer_mobile,
          customer_name: j.customer_name,
          status: j.status,
        }),
      );
    } catch (err) {
      console.log('[repairStatus] error →', err.message);
      alert(err.message || 'Could not update the repair status. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  // Handover step 1: ask the server to generate the handover OTP. On success
  // open the OTP entry; the final status update (3) happens once it matches.
  const handleHandover = async () => {
    const customerId = (jobSummary && jobSummary.customer_id) || j.customer_id;
    if (starting) return;
    const payload = { member_id: user.member_id, customer_id: customerId };
    setStarting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.HANDOVER_REPAIR, payload);
      const otp = data && data.otp != null ? String(data.otp) : '';
      console.log('[handoverOtp] request →', payload);
      console.log('[handoverOtp] response →', response.status, JSON.stringify(data));
      console.log('[handoverOtp] OTP received from API →', otp || '(none)');
      if (!response.ok || (data && data.success === false) || !otp) {
        alert(
          (data && (data.message || data.msg)) ||
            'Could not generate the handover OTP. Please try again.',
        );
        return;
      }
      console.log('[handoverOtp] OTP popup opened, waiting for input');
      setExpectedOtp(otp);
      setEnteredOtp('');
      setOtpError('');
      setOtpVisible(true);
    } catch (err) {
      console.log('[handoverOtp] error →', err.message);
      alert(err.message || 'Could not generate the handover OTP. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  // Handover step 2: compare the typed OTP with the one the server returned;
  // if they match, submit the final status (3).
  const handleVerifyOtp = async () => {
    const matches = enteredOtp.trim() === expectedOtp;
    console.log('[handoverOtp] compare →', {
      entered: enteredOtp.trim(),
      expected: expectedOtp,
      match: matches,
    });
    if (!matches) {
      setOtpError('Incorrect OTP. Please check the code and try again.');
      return;
    }
    setOtpError('');
    setOtpVisible(false);
    console.log('[handoverOtp] OTP matched → asking to confirm final status 3');
    confirmAction({
      title: 'Complete handover?',
      message: 'The OTP matched. Confirm the device has been handed over to the customer.',
      confirmText: 'Complete handover',
      onConfirm: () => handleAdvanceStatus(3),
    });
  };

  const closeOtp = () => {
    setOtpVisible(false);
    setEnteredOtp('');
    setOtpError('');
  };

  // Each step of the job process asks for confirmation before it is sent.
  const STAGE_CONFIRM = {
    0: {
      title: 'Start repair?',
      message: 'The job will be marked as in progress and the repair timer starts.',
      confirmText: 'Start repair',
    },
    1: {
      title: 'Mark repair as completed?',
      message: 'Confirm the repair work on this device is finished.',
      confirmText: 'Yes, completed',
    },
    2: {
      title: 'Start handover?',
      message: 'An OTP will be generated for the customer to confirm the device handover.',
      confirmText: 'Start handover',
    },
  };

  const confirmStage = () => {
    const stage = REPAIR_STAGES[repairStatus];
    const copy = STAGE_CONFIRM[repairStatus];
    if (!stage || !copy) return;
    confirmAction({
      ...copy,
      onConfirm: () => (repairStatus === 2 ? handleHandover() : handleAdvanceStatus(stage.next)),
    });
  };

  const tabs = ['Overview', 'Repair', 'Timeline'];

  // Build the view model from the fetched job.
  const j = job || {};
  const repairStatus = Number(j.completed_status) || 0;
  let parsed = {};
  try { parsed = j.details_json ? JSON.parse(j.details_json) : {}; } catch (e) {}
  const statusMeta =
    STATUS_META[j.status] || { label: j.status || '—', color: '#9CA3AF', bg: '#F3F4F6' };
  const deviceName = [j.device_brand, j.device_model].filter(Boolean).join(' ') || 'Device';
  const deviceSpec = [j.storage, j.color].filter(Boolean).join(' · ');
  const estimate =
    j.estimated_cost != null ? `₹${Number(j.estimated_cost).toLocaleString('en-IN')}` : '—';
  const lockType =
    (parsed.access && parsed.access.lock_type) ||
    (j.access_mode === 'temporary_pin' ? 'password' : 'none');
  const lockLabel = LOCK_LABEL[lockType] || lockType;
  const unlockValue = j.unlock_value || (parsed.access && parsed.access.unlock_value) || '';
  // The job can come from job_sheet_details (conditions[] / photos[] arrays,
  // customer_mobile) or from the list API (flat screen/body/... fields,
  // frontimage/backimage/damageimage URLs, mobile_number, aadharnumber).
  const FLAT_CONDITIONS = [
    ['screen', 'screen'],
    ['body', 'body'],
    ['camera', 'camera'],
    ['speaker', 'speaker'],
    ['charging_port', 'chargingpoint'],
    ['battery', 'batterey'],
  ];
  const conditions =
    Array.isArray(j.conditions) && j.conditions.length > 0
      ? j.conditions
      : FLAT_CONDITIONS.filter(([, key]) => j[key]).map(([component, key]) => ({
          component,
          condition_value: j[key],
        }));

  const imageUri = v => {
    if (!v || typeof v !== 'string' || v.length > 500) return null;
    return /^https?:\/\//.test(v) ? v : `${BASE_URL}${String(v).replace(/^\//, '')}`;
  };
  const photos =
    Array.isArray(j.photos) && j.photos.length > 0
      ? j.photos
          .map(p => ({ type: p.photo_type, uri: imageUri(p.storage_path) }))
          .filter(p => p.uri)
      : [
          ['front', j.frontimage],
          ['back', j.backimage],
          ['damage', j.damageimage],
        ]
          .map(([type, v]) => ({ type, uri: imageUri(v) }))
          .filter(p => p.uri);

  const customerMobile = j.customer_mobile || j.mobile_number;
  const aadhaarLast4 =
    j.aadhaar_last4 || (j.aadharnumber ? String(j.aadharnumber).slice(-4) : '');
  const fmtDateTime = v => {
    if (!v) return '';
    const d = new Date(String(v).replace(' ', 'T'));
    if (isNaN(d)) return String(v);
    const hasTime = !/00:00:00(\.000)?Z?$/.test(String(v));
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  };
  const money = v =>
    v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '';
  const STAGE_LABEL = { 0: 'Not started', 1: 'Repair in progress', 2: 'Repair completed', 3: 'Handed over' };
  const prettify = s =>
    String(s || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

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
            <Text style={styles.headerTitle}>Job Details</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Tab Navigation */}
          {/* <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.toLowerCase()}
                style={[
                  styles.tab,
                  activeTab === tab.toLowerCase() && styles.tabActive,
                ]}
                onPress={() => {
                  const tabType = tab.toLowerCase();
                  if (tabType === 'overview') {
                    setActiveTab('overview');
                  } else if (tabType === 'repair') {
                    console.log('🚀 Repair tab clicked, navigating to repairProgress');
                    onNavigate('repairProgress', { initialTab: 'repair' });
                  } else if (tabType === 'timeline') {
                    console.log('🚀 Timeline tab clicked, navigating to jobTimeline');
                    onNavigate('jobTimeline', { initialTab: 'timeline' });
                  }
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.toLowerCase() && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View> */}

          {/* Status Badge */}
          {!!job && j.status !== 'draft' && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                <Text style={[styles.statusText, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>
          )}

          {/* Content Section */}
          <View style={styles.content}>
            {loading && !job ? (
              <SkeletonDetails />
            ) : !job ? (
              <View style={styles.loadingBox}>
                <Text style={styles.emptyText}>{loadError || 'Job not found.'}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setReloadKey(k => k + 1)}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Device Info Card */}
                <View style={styles.deviceInfoCard}>
                  <Image
                    source={
                      photos.length
                        ? { uri: photos[0].uri }
                        : require('../../Assets/images/sampleMobileImg.png')
                    }
                    style={styles.deviceInfoImage}
                  />
                  <View style={styles.deviceInfoContent}>
                    <Text style={styles.deviceName}>{deviceName}</Text>
                    {!!deviceSpec && <Text style={styles.deviceSpec}>{deviceSpec}</Text>}
                    <Text style={styles.imei}>IMEI {j.imei1 || '—'}</Text>
                  </View>
                </View>

                {/* Detail sections */}
                {[
                  {
                    title: j.job_code ? `Job ${j.job_code}` : `Job #${j.id || jobId || ''}`,
                    rows: [
                      ['Repair stage', STAGE_LABEL[repairStatus]],
                      ['Approval', prettify(j.approval_status)],
                      ['Category', prettify(j.repair_category)],
                      ['Complaint', j.problem_description],
                      ['Estimate', estimate],
                      ['Final cost', money(j.final_cost)],
                      ['Estimated delivery', fmtDateTime(j.estimated_delivery)],
                      ['Technician notes', j.technician_notes],
                    ],
                  },
                  {
                    title: 'Customer',
                    rows: [
                      ['Name', j.customer_name],
                      ['Mobile', customerMobile],
                      ['Alternate', j.alternate_mobile],
                      ['Aadhaar', aadhaarLast4 ? `•••• ${aadhaarLast4}` : ''],
                      ['Address', j.address],
                    ],
                  },
                  {
                    title: 'Device',
                    rows: [
                      ['Brand', j.device_brand],
                      ['Model', j.device_model],
                      ['Storage', j.storage],
                      ['Color', j.color],
                      ['IMEI 1', j.imei1],
                      ['IMEI 2', j.imei2],
                    ],
                  },
                  {
                    title: 'Access & security',
                    rows: [
                      ['Device lock', unlockValue || j.devicelock ? `${lockLabel} · ${unlockValue || j.devicelock}` : lockLabel],
                      ['Consent OTP', parsed.consent_otp],
                    ],
                  },
                  {
                    title: 'Timeline',
                    rows: [
                      ['Created', fmtDateTime(j.created_at)],
                      ['Last updated', fmtDateTime(j.updated_at)],
                      ['Completed', fmtDateTime(j.completed_at)],
                    ],
                  },
                ].map(section => {
                  const rows = section.rows.filter(
                    ([, v]) => v !== undefined && v !== null && v !== '',
                  );
                  if (rows.length === 0) return null;
                  return (
                    <View key={section.title} style={styles.jobDetailsCard}>
                      <Text style={styles.jobId}>{section.title}</Text>
                      {rows.map(([label, value], idx) => (
                        <View key={label}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{label}</Text>
                            <Text style={styles.detailValue}>{String(value)}</Text>
                          </View>
                          {idx < rows.length - 1 && <View style={styles.divider} />}
                        </View>
                      ))}
                    </View>
                  );
                })}

                {/* Device Condition */}
                {conditions.length > 0 && (
                  <View style={styles.jobDetailsCard}>
                    <Text style={styles.jobId}>Device condition</Text>
                    {conditions.map((c, idx) => (
                      <View key={`${c.component}-${idx}`}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{prettify(c.component)}</Text>
                          <Text style={styles.detailValue}>{prettify(c.condition_value)}</Text>
                        </View>
                        {idx < conditions.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                  </View>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <View style={styles.jobDetailsCard}>
                    <Text style={styles.jobId}>Device photos</Text>
                    <View style={styles.photoRow}>
                      {photos.map((p, idx) => (
                        <View key={`${p.type}-${idx}`} style={styles.photoItem}>
                          <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                          <Text style={styles.photoCaption}>{prettify(p.type)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Start Repair Button */}
        {!!job && !!REPAIR_STAGES[repairStatus] && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.startButton}
              disabled={starting}
              onPress={confirmStage}
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.startButtonText}>
                  {REPAIR_STAGES[repairStatus].label}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Handover OTP */}
        <Modal
          transparent
          animationType="fade"
          visible={otpVisible}
          onRequestClose={closeOtp}
          statusBarTranslucent
        >
          <View style={styles.otpScrim}>
            <View style={styles.otpCard}>
              <Text style={styles.otpTitle}>Handover OTP</Text>
              <Text style={styles.otpSubtitle}>
                Enter the 6-digit code sent to the customer to complete the handover.
              </Text>
              <TextInput
                style={[styles.otpInput, !!otpError && styles.otpInputError]}
                value={enteredOtp}
                onChangeText={text => {
                  setEnteredOtp(text.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="------"
                placeholderTextColor="#D1D5DB"
                autoFocus
              />
              {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}
              <View style={styles.otpActions}>
                <TouchableOpacity style={[styles.otpButton, styles.otpCancel]} onPress={closeOtp}>
                  <Text style={styles.otpCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.otpButton, styles.otpConfirm, enteredOtp.length < 6 && styles.otpDisabled]}
                  disabled={enteredOtp.length < 6}
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.otpConfirmText}>Verify & complete</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  closeOtp();
                  handleHandover();
                }}
              >
                <Text style={styles.otpResend}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
    borderRadius: wp('3%'),
  },
  tabActive: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  deviceImageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('10%'),
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceImage: {
    width: wp('95%'),
    height: hp('18%'),
    resizeMode: 'contain',
  },
  deviceInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deviceInfoImage: {
    width: wp('15%'),
    height: hp('6%'),
    // resizeMode: 'contain',
  },
  deviceInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceSpec: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  imei: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  jobDetailsCard: {
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
  jobId: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
  tabContent: {
    marginBottom: 24,
  },
  tabContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  repairCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  repairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  repairLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  repairValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarker: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timelineDotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  timelineLine: {
    marginLeft: 20,
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  timelineInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timelineTimeGray: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('6%'),
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoItem: {
    alignItems: 'center',
  },
  photoThumb: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  photoCaption: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 24,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  otpScrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  otpCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  otpTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  otpSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 18 },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
    color: '#1F2937',
  },
  otpInputError: { borderColor: '#DC2626' },
  otpErrorText: { color: '#DC2626', fontSize: 13, marginTop: 8 },
  otpActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  otpButton: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  otpCancel: { backgroundColor: '#F3F4F6' },
  otpCancelText: { color: '#374151', fontWeight: '600' },
  otpConfirm: { backgroundColor: Colors.primary },
  otpConfirmText: { color: '#FFFFFF', fontWeight: '600' },
  otpDisabled: { opacity: 0.5 },
  otpResend: { textAlign: 'center', color: Colors.primary, fontWeight: '600', marginTop: 16 },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#9CA3AF',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
