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
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';

import { useSelector, useDispatch } from 'react-redux';
import { SkeletonDetails } from '../../Components/Skeleton';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS, BASE_URL } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { confirmAction } from '../../utils/appModal';
import { sanitizeAmount } from '../../Components/FieldNav';
import { setActiveJob } from '../../redux/slices/jobSheetSlice';
import useRefresh from '../../utils/useRefresh';

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

// Colour for a condition value: good / working = green, damaged / broken = red, else amber.
const conditionTone = value => {
  const v = String(value || '').toLowerCase();
  if (/(good|work|ok|fine|perfect|normal|new)/.test(v) && !/not|no /.test(v)) return { fg: '#15803D', bg: '#DCFCE7' };
  if (/(damag|broken|crack|dead|bad|not|fail|faulty|no )/.test(v)) return { fg: '#B91C1C', bg: '#FEE2E2' };
  return { fg: '#B45309', bg: '#FEF3C7' };
};

const LOCK_LABEL = { none: 'No lock', password: 'Password', pattern: 'Pattern' };

export default function JobDetailsScreen({ onNavigate, jobId, jobSummary }) {
  const { tick, refreshControl } = useRefresh();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState('overview');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the full record couldn't be loaded.
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [starting, setStarting] = useState(false);
  // Handover OTP: the technician types the code the customer received and the server
  // checks it (verify_handoverotp).
  // Handover step 1: the final amount the customer pays, asked before the OTP is generated.
  const [amountVisible, setAmountVisible] = useState(false);
  const [finalAmount, setFinalAmount] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
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
          let record = Array.isArray(data.data) ? data.data[0] : data.data;
          if (record && typeof record === 'object') {
            // Customer details may come nested ({ customer: { ... } }) ...
            const c = record.customer && typeof record.customer === 'object' ? record.customer : null;
            if (c) {
              record = {
                customer_name: c.customer_name || c.full_name || c.name,
                customer_mobile: c.customer_mobile || c.mobile_number || c.mobile,
                alternate_mobile: c.alternate_mobile || c.customer_alternatenumber,
                aadhaar_last4: c.aadhaar_last4,
                aadharnumber: c.aadharnumber,
                address: c.address,
                ...record,
              };
            }
            // The job record carries only customer_id (its customer_name / mobile come back
            // empty). Customers are listed by getjobsdata ({ id, customer_name, customer_number,
            // customer_alternatenumber, aadharnumber, customer_image }), so match on that id.
            if (record.customer_id && !record.customer_name) {
              try {
                const res = await postJson(ENDPOINTS.GET_JOBS_DATA, { member_id: user.member_id });
                const rows = res.response.ok && res.data && Array.isArray(res.data.data) ? res.data.data : [];
                const c = rows.find(r => String(r.id) === String(record.customer_id));
                if (c) {
                  record = {
                    ...record,
                    customer_name: c.customer_name,
                    customer_mobile: c.customer_number,
                    alternate_mobile: c.customer_alternatenumber || record.alternate_mobile,
                    aadharnumber: c.aadharnumber || record.aadharnumber,
                    customer_photo: c.customer_image || record.customer_photo,
                  };
                }
              } catch (e) {
                // fall through to the list row below
              }
            }
            // ... or be missing altogether: then take them from the job list row the screen
            // was opened with (or look the job up in the list). The details record wins
            // wherever it has a value.
            if (!record.customer_name && !record.customer_mobile && !record.mobile_number) {
              const row = await fallbackFromList();
              if (row) {
                const filled = Object.fromEntries(
                  Object.entries(record).filter(([, v]) => v !== undefined && v !== null && v !== ''),
                );
                record = { ...row, ...filled };
              }
            }
          }
          if (!active) return;
          setJob(record);
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
  }, [jobId, reloadKey, tick]);

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
    // The handover (status 3) also carries the final amount entered before the OTP.
    if (nextStatus === 3 && finalAmount) {
      payload.final_cost = finalAmount;
    }
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
          customer_mobile: j.customer_mobile || j.mobile_number,
          customer_name: j.customer_name,
          customer_id: j.customer_id,
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
      console.log('[handoverOtp] request →', payload);
      console.log('[handoverOtp] response →', response.status, JSON.stringify(data));
      if (!response.ok || (data && data.success === false)) {
        alert(
          (data && (data.message || data.msg)) ||
            'Could not generate the handover OTP. Please try again.',
        );
        return;
      }
      console.log('[handoverOtp] OTP popup opened, waiting for input');
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

  // Handover step 2: the server checks the typed OTP (POST verify_handoverotp with the
  // customer's mobile, the OTP and the customer id). An empty answer means the OTP is wrong;
  // when it is accepted, submit the final status (3).
  const handleVerifyOtp = async () => {
    if (verifyingOtp) return;
    const mobile = String(j.customer_mobile || j.mobile_number || '').replace(/\D/g, '').slice(-10);
    const customerId = (jobSummary && jobSummary.customer_id) || j.customer_id;
    const payload = { mobile, otp: enteredOtp.trim(), customer_id: customerId };
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const { response, data } = await postJson(ENDPOINTS.VERIFY_HANDOVER_OTP, payload);
      console.log('[handoverOtp] verify →', response.status, JSON.stringify(data));
      const accepted =
        response.ok &&
        data &&
        data.success !== false &&
        (Array.isArray(data.data) ? data.data.length > 0 : !!data.data);
      if (!accepted) {
        setOtpError(
          (data && data.success === false && (data.message || data.msg)) ||
            'Incorrect OTP. Please check the code and try again.',
        );
        return;
      }
    } catch (err) {
      setOtpError(err.message || 'Could not verify the OTP. Please try again.');
      return;
    } finally {
      setVerifyingOtp(false);
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

  const handleSkipOtp = () => {
    if (verifyingOtp || starting) return;
    confirmAction({
      title: 'Skip OTP verification?',
      message: 'Complete the handover without verifying the customer OTP.',
      confirmText: 'Skip & complete',
      onConfirm: () => {
        closeOtp();
        handleAdvanceStatus(3);
      },
    });
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
    if (repairStatus === 2) {
      // Ask for the final amount first; the OTP step comes after it.
      const known = j.final_cost != null && j.final_cost !== '' ? j.final_cost : j.estimated_cost;
      setFinalAmount(known != null && known !== '' ? String(Number(known) || '') : '');
      setAmountVisible(true);
      return;
    }
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
  const unlockValue = j.unlock_value || (parsed.access && parsed.access.unlock_value) || '';
  // The job record keeps the saved lock in `devicelock` (access_mode can still say
  // customer_unlocks), so a value there means there is a lock: a pattern looks like
  // "1 → 2 → 5", anything else is a password / PIN.
  const savedLock = String(unlockValue || j.devicelock || '').trim();
  const lockType =
    (parsed.access && parsed.access.lock_type) ||
    (savedLock
      ? /→|^\d(\s*[-,>]\s*\d)+$/.test(savedLock)
        ? 'pattern'
        : 'password'
      : j.access_mode === 'temporary_pin'
      ? 'password'
      : 'none');
  const lockLabel = LOCK_LABEL[lockType] || lockType;
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
  const fmtDateOnly = v => {
    if (!v) return '';
    const value = String(v).trim();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (datePart) {
      const [, year, month, day] = datePart;
      const monthNumber = Number(month);
      const dayNumber = Number(day);
      const parsedDate = new Date(Date.UTC(Number(year), monthNumber - 1, dayNumber));
      if (
        monthNumber >= 1 &&
        monthNumber <= 12 &&
        parsedDate.getUTCFullYear() === Number(year) &&
        parsedDate.getUTCMonth() === monthNumber - 1 &&
        parsedDate.getUTCDate() === dayNumber
      ) {
        return `${dayNumber} ${months[monthNumber - 1]} ${year}`;
      }
    }

    const d = new Date(value.replace(' ', 'T'));
    if (isNaN(d)) return value;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const handedOverDate =
    (repairStatus >= 3 || j.status === 'completed')
      ? fmtDateOnly(j.completed_at) || fmtDateOnly(j.updated_at)
      : '';
  const deliveryDate =
    handedOverDate || fmtDateOnly(j.estimated_delivery) || '—';
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
        {/* Fixed top bar: stays put while the cards scroll underneath, so they never run up
            into the status bar. */}
        <View style={styles.fixedBar}>
          <View style={styles.heroTop}>
              <TouchableOpacity onPress={handleBackPress} style={styles.heroBack}>
                <Text style={styles.heroBackText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>Job details</Text>
              {!!job && (
                <View style={styles.heroCode}>
                  <Text style={styles.heroCodeText}>{j.job_code || `#${j.id || jobId || ''}`}</Text>
                </View>
              )}
            </View>

        </View>

        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
          {/* Hero: back, job code, device, status and a four-step progress line */}
          <View style={styles.hero}>
            {!!job && (
              <>
                <View style={styles.heroDevice}>
                  <Image
                    source={
                      photos.length
                        ? { uri: photos[0].uri }
                        : require('../../Assets/images/sampleMobileImg.png')
                    }
                    style={styles.heroImage}
                  />
                  <View style={styles.heroDeviceText}>
                    <Text style={styles.heroDeviceName} numberOfLines={2}>
                      {deviceName}
                    </Text>
                    {!!deviceSpec && <Text style={styles.heroDeviceSpec}>{deviceSpec}</Text>}
                    <Text style={styles.heroImei}>IMEI {j.imei1 || '—'}</Text>
                    {j.status !== 'draft' && (
                      <View style={[styles.heroStatus, { backgroundColor: statusMeta.bg }]}>
                        <View style={[styles.heroStatusDot, { backgroundColor: statusMeta.color }]} />
                        <Text style={[styles.heroStatusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Progress: Received > Repairing > Completed > Handed over */}
                <View style={styles.steps}>
                  {['Received', 'Repairing', 'Completed', 'Handed over'].map((label, i) => {
                    const done = i <= repairStatus;
                    return (
                      <View key={label} style={styles.step}>
                        <View style={styles.stepLineRow}>
                          <View style={[styles.stepLine, i === 0 && styles.stepLineHidden, i <= repairStatus && styles.stepLineOn]} />
                          <View style={[styles.stepDot, done && styles.stepDotOn]}>
                            {done && <Text style={styles.stepCheck}>✓</Text>}
                          </View>
                          <View
                            style={[styles.stepLine, i === 3 && styles.stepLineHidden, i < repairStatus && styles.stepLineOn]}
                          />
                        </View>
                        <Text style={[styles.stepLabel, done && styles.stepLabelOn]} numberOfLines={1}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>

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
                {/* Money and delivery at a glance */}
                <View style={styles.statRow}>
                  {[
                    ['Estimate', estimate, '#2563EB'],
                    ['Final cost', money(j.final_cost) || '—', '#16A34A'],
                    ['Delivery', deliveryDate, '#D97706'],
                  ].map(([label, value, color]) => (
                    <View key={label} style={styles.statCard}>
                      <Text style={styles.statLabel}>{label}</Text>
                      <Text style={[styles.statValue, { color }]} numberOfLines={2}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Detail sections */}
                {[
                  {
                    icon: '🛠️',
                    title: 'Repair',
                    rows: [
                      ['Repair stage', STAGE_LABEL[repairStatus]],
                      ['Approval', prettify(j.approval_status)],
                      ['Category', prettify(j.repair_category)],
                      ['Complaint', j.problem_description],
                      ['Technician notes', j.technician_notes],
                    ],
                  },
                  {
                    icon: '👤',
                    title: 'Customer',
                    call: customerMobile,
                    rows: [
                      ['Name', j.customer_name],
                      ['Mobile', customerMobile],
                      ['Alternate', j.alternate_mobile],
                      ['Aadhaar', aadhaarLast4 ? `•••• ${aadhaarLast4}` : ''],
                      ['Address', j.address],
                    ],
                  },
                  {
                    icon: '📱',
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
                    icon: '🔒',
                    title: 'Access & security',
                    rows: [
                      ['Device lock', savedLock ? `${lockLabel} · ${savedLock}` : lockLabel],
                      ['Consent OTP', parsed.consent_otp],
                    ],
                  },
                ].map(section => {
                  const rows = section.rows.filter(
                    ([, v]) => v !== undefined && v !== null && v !== '',
                  );
                  if (rows.length === 0) return null;
                  return (
                    <View key={section.title} style={styles.sectionCard}>
                      <View style={styles.sectionHead}>
                        <View style={styles.sectionIcon}>
                          <Text style={styles.sectionIconText}>{section.icon}</Text>
                        </View>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {!!section.call && (
                          <TouchableOpacity
                            style={styles.callBtn}
                            onPress={() => Linking.openURL(`tel:${section.call}`)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.callBtnText}>📞 Call</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {rows.map(([label, value], idx) => (
                        <View key={label} style={[styles.kvRow, idx === rows.length - 1 && styles.kvRowLast]}>
                          <Text style={styles.kvLabel}>{label}</Text>
                          <Text style={styles.kvValue}>{String(value)}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}

                {/* Device condition as coloured chips */}
                {conditions.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHead}>
                      <View style={styles.sectionIcon}>
                        <Text style={styles.sectionIconText}>🩺</Text>
                      </View>
                      <Text style={styles.sectionTitle}>Device condition</Text>
                    </View>
                    <View style={styles.chipWrap}>
                      {conditions.map((c, idx) => {
                        const tone = conditionTone(c.condition_value);
                        return (
                          <View key={`${c.component}-${idx}`} style={[styles.condChip, { backgroundColor: tone.bg }]}>
                            <Text style={styles.condName}>{prettify(c.component)}</Text>
                            <Text style={[styles.condValue, { color: tone.fg }]}>{prettify(c.condition_value)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHead}>
                      <View style={styles.sectionIcon}>
                        <Text style={styles.sectionIconText}>🖼️</Text>
                      </View>
                      <Text style={styles.sectionTitle}>Device photos</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {photos.map((p, idx) => (
                        <View key={`${p.type}-${idx}`} style={styles.photoItem}>
                          <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                          <Text style={styles.photoCaption}>{prettify(p.type)}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Timeline */}
                {[
                  ['Created', fmtDateTime(j.created_at)],
                  ['Last updated', fmtDateTime(j.updated_at)],
                  ['Completed', fmtDateTime(j.completed_at)],
                ].some(([, v]) => v) && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHead}>
                      <View style={styles.sectionIcon}>
                        <Text style={styles.sectionIconText}>🕒</Text>
                      </View>
                      <Text style={styles.sectionTitle}>Timeline</Text>
                    </View>
                    {[
                      ['Created', fmtDateTime(j.created_at)],
                      ['Last updated', fmtDateTime(j.updated_at)],
                      ['Completed', fmtDateTime(j.completed_at)],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value], idx, arr) => (
                        <View key={label} style={styles.tlRow}>
                          <View style={styles.tlRail}>
                            <View style={styles.tlDot} />
                            {idx < arr.length - 1 && <View style={styles.tlLine} />}
                          </View>
                          <View style={styles.tlText}>
                            <Text style={styles.tlLabel}>{label}</Text>
                            <Text style={styles.tlValue}>{value}</Text>
                          </View>
                        </View>
                      ))}
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

        {/* Handover: final amount first */}
        <Modal
          transparent
          animationType="fade"
          visible={amountVisible}
          onRequestClose={() => setAmountVisible(false)}
          statusBarTranslucent
        >
          <View style={styles.otpScrim}>
            <View style={styles.otpCard}>
              <Text style={styles.otpTitle}>Final amount</Text>
              <Text style={styles.otpSubtitle}>
                Enter the final amount for this repair. The customer OTP comes next.
              </Text>
              <View style={styles.amountBox}>
                <Text style={styles.amountSymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={finalAmount}
                  onChangeText={text => setFinalAmount(sanitizeAmount(text))}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              {j.estimated_cost != null && j.estimated_cost !== '' && (
                <Text style={styles.amountHint}>
                  Estimate was ₹{Number(j.estimated_cost).toLocaleString('en-IN')}
                </Text>
              )}
              <View style={styles.otpActions}>
                <TouchableOpacity
                  style={[styles.otpButton, styles.otpCancel]}
                  onPress={() => setAmountVisible(false)}
                >
                  <Text style={styles.otpCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.otpButton, styles.otpConfirm, !(Number(finalAmount) > 0) && styles.otpDisabled]}
                  disabled={!(Number(finalAmount) > 0) || starting}
                  onPress={() => {
                    setAmountVisible(false);
                    handleHandover();
                  }}
                >
                  <Text style={styles.otpConfirmText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                  style={[styles.otpButton, styles.otpConfirm, (enteredOtp.length < 6 || verifyingOtp) && styles.otpDisabled]}
                  disabled={enteredOtp.length < 6 || verifyingOtp}
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.otpConfirmText}>{verifyingOtp ? 'Verifying…' : 'Verify & complete'}</Text>
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
              <TouchableOpacity
                onPress={handleSkipOtp}
                disabled={verifyingOtp || starting}
              >
                <Text style={styles.otpSkip}>Skip verification for now</Text>
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
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 6,
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
  photoItemOld: {
    alignItems: 'center',
  },
  photoThumbOld: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  photoCaptionOld: {
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
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  amountSymbol: { fontSize: 24, fontWeight: '700', color: '#6B7280', marginRight: 6 },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: 26, fontWeight: '700', color: '#1F2937' },
  amountHint: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
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
  otpSkip: { textAlign: 'center', color: '#2F5DDC', fontWeight: '600', marginTop: 16 },
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

  // ---- redesigned layout
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingBottom: 38,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  fixedBar: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    zIndex: 2,
  },
  heroBack: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  heroBackText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, includeFontPadding: false },
  heroTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginLeft: 4 },
  heroCode: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  heroCodeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  heroDevice: { flexDirection: 'row', alignItems: 'center' },
  heroImage: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroDeviceText: { flex: 1, marginLeft: 12 },
  heroDeviceName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroDeviceSpec: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  heroImei: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  heroStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 6,
  },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  heroStatusText: { fontSize: 11, fontWeight: '800' },
  steps: { flexDirection: 'row', marginTop: 14 },
  step: { flex: 1, alignItems: 'center' },
  stepLineRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepLineHidden: { backgroundColor: 'transparent' },
  stepLineOn: { backgroundColor: '#22C55E' },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: '#22C55E' },
  stepCheck: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', lineHeight: 13 },
  stepLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', marginTop: 4 },
  stepLabelOn: { color: '#FFFFFF' },

  statRow: { flexDirection: 'row', gap: 8, marginTop: -22, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  statValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 3,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionIconText: { fontSize: 14 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  callBtn: { backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  callBtnText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  kvRowLast: { borderBottomWidth: 0 },
  kvLabel: { fontSize: 12, color: '#94A3B8', marginRight: 10 },
  kvValue: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'right' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  condChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6 },
  condName: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  condValue: { fontSize: 12, fontWeight: '800', marginTop: 0 },

  tlRow: { flexDirection: 'row' },
  tlRail: { width: 22, alignItems: 'center' },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.secondary, marginTop: 5 },
  tlLine: { flex: 1, width: 2, backgroundColor: '#E2E8F0', marginVertical: 2 },
  tlText: { flex: 1, paddingBottom: 8, marginLeft: 6 },
  tlLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  tlValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 0 },
  photoItem: { marginRight: 10, alignItems: 'center' },
  photoThumb: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#F1F5F9' },
  photoCaption: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 4 },
});
