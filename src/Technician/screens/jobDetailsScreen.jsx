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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { useSelector, useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS, BASE_URL } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
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

export default function JobDetailsScreen({ onNavigate, jobId }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState('overview');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!jobId) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { response, data } = await postJson(ENDPOINTS.JOB_SHEET_DETAILS, {
          job_id: jobId,
        });
        if (active && response.ok && data && data.success !== false) {
          setJob(data.data);
        }
      } catch (e) {
        // leave job null on failure
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [jobId]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('jobs');
    }
  };

  const handleStartRepair = () => {
    if (!jobId) return;
    // Don't change the status yet — it stays 'open' (Active) until the
    // technician submits repair progress. Just remember which job we're working
    // on for the repair → quality-check → handover flow.
    dispatch(
      setActiveJob({
        id: jobId,
        job_code: j.job_code,
        customer_mobile: j.customer_mobile,
        customer_name: j.customer_name,
        status: j.status,
      }),
    );
    if (onNavigate) {
      onNavigate('repairProgress', { initialTab: 'repair' });
    }
  };

  const handleFinishRepair = () => {
    // Job is already in progress — go to the timeline to finish it.
    if (onNavigate) {
      onNavigate('jobTimeline', { initialTab: 'timeline' });
    }
  };

  const tabs = ['Overview', 'Repair', 'Timeline'];

  // Build the view model from the fetched job.
  const j = job || {};
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
  const conditions = j.conditions || [];
  const photos = j.photos || [];
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
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.statusText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {loading && !job ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : !job ? (
              <View style={styles.loadingBox}>
                <Text style={styles.emptyText}>Job not found.</Text>
              </View>
            ) : (
              <>
                {/* Device Info Card */}
                <View style={styles.deviceInfoCard}>
                  <Image
                    source={require('../../Assets/images/sampleMobileImg.png')}
                    style={styles.deviceInfoImage}
                  />
                  <View style={styles.deviceInfoContent}>
                    <Text style={styles.deviceName}>{deviceName}</Text>
                    {!!deviceSpec && <Text style={styles.deviceSpec}>{deviceSpec}</Text>}
                    <Text style={styles.imei}>IMEI {j.imei1 || '—'}</Text>
                  </View>
                </View>

                {/* Job + Customer Details */}
                <View style={styles.jobDetailsCard}>
                  <Text style={styles.jobId}>Job {j.job_code}</Text>

                  {[
                    ['Customer', j.customer_name],
                    ['Mobile', j.customer_mobile],
                    ['Alternate', j.alternate_mobile],
                    ['Aadhaar', j.aadhaar_last4 ? `•••• ${j.aadhaar_last4}` : ''],
                    ['Category', prettify(j.repair_category)],
                    ['Complaint', j.problem_description],
                    ['Estimate', estimate],
                    ['Device lock', unlockValue ? `${lockLabel} · ${unlockValue}` : lockLabel],
                    ['Consent OTP', parsed.consent_otp],
                  ]
                    .filter(([, v]) => v !== undefined && v !== null && v !== '')
                    .map(([label, value], idx, arr) => (
                      <View key={label}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{label}</Text>
                          <Text style={styles.detailValue}>{String(value)}</Text>
                        </View>
                        {idx < arr.length - 1 && <View style={styles.divider} />}
                      </View>
                    ))}
                </View>

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
                        <View key={`${p.photo_type}-${idx}`} style={styles.photoItem}>
                          <Image
                            source={{ uri: `${BASE_URL}${p.storage_path}` }}
                            style={styles.photoThumb}
                          />
                          <Text style={styles.photoCaption}>{prettify(p.photo_type)}</Text>
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
        <View style={styles.buttonContainer}>
          {j.status === 'ready' ? (
            <View style={[styles.startButton, styles.completedButton]}>
              <Text style={styles.startButtonText}>Completed</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={j.status === 'in_progress' ? handleFinishRepair : handleStartRepair}
            >
              <Text style={styles.startButtonText}>
                {j.status === 'in_progress' ? 'Finish repair' : 'Start repair'}
              </Text>
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
