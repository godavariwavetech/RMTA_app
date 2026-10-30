import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { useSelector, useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { setActiveJob } from '../../redux/slices/jobSheetSlice';
import { sanitizeAmount, useFieldNav, FieldNavBar } from '../../Components/FieldNav';
import { confirmAction } from '../../utils/appModal';

const STATUS_LABELS = {
  open: 'Active',
  in_progress: 'In progress',
  waiting_parts: 'Waiting parts',
  quality_check: 'Quality check',
  ready: 'Ready',
  completed: 'Completed',
};

export default function RepairProgressScreen({ onNavigate, initialTab = 'repair' }) {
  const nav = useFieldNav();
  const dispatch = useDispatch();
  const activeJob = useSelector(state => state.jobSheet.activeJob) || {};
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  // Pre-fill from whatever was saved on the active job so coming back keeps it.
  const savedProgress = activeJob.repairProgress || {};
  const [selectedStatus, setSelectedStatus] = useState(savedProgress.selectedStatus || '');
  const [technicianNotes, setTechnicianNotes] = useState(savedProgress.technicianNotes || '');
  const [finalCost, setFinalCost] = useState(savedProgress.finalCost || '');
  const [submitting, setSubmitting] = useState(false);

  // Badge reflects the job's real status (Active until repair is submitted).
  const statusLabel = STATUS_LABELS[activeJob.status] || 'Active';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Save the entered repair progress onto the active job so it survives
  // navigating away and back.
  const persistProgress = extra =>
    dispatch(
      setActiveJob({
        ...activeJob,
        ...extra,
        repairProgress: { selectedStatus, technicianNotes, finalCost },
      }),
    );

  const handleBackPress = () => {
    persistProgress();
    if (onNavigate) {
      onNavigate('jobDetails');
    }
  };

  const handleSubmitProgress = async () => {
    if (submitting) return;
    const jobId = activeJob.id;
    // Keep the entered progress regardless of what happens next.
    persistProgress();
    if (!jobId) {
      // No job in context — just move on.
      if (onNavigate) onNavigate('jobTimeline', { initialTab: 'timeline' });
      return;
    }
    // Submitting repair progress flips the job to 'in_progress' on the server.
    setSubmitting(true);
    try {
      const { response, data } = await postJson(ENDPOINTS.START_JOB_REPAIR, {
        job_id: jobId,
        user_id: user.user_id,
      });
      if (!response.ok || (data && data.success === false)) {
        setSubmitting(false);
        alert((data && data.message) || 'Could not submit repair progress. Please try again.');
        return;
      }
      persistProgress({ status: 'in_progress' });
    } catch (err) {
      setSubmitting(false);
      alert(err.message);
      return;
    }
    setSubmitting(false);
    if (onNavigate) {
      onNavigate('jobTimeline', { initialTab: 'timeline' });
    }
  };

  const tabs = ['Overview', 'Repair', 'Timeline'];
  const statusOptions = [
    { id: 'inProgress', label: 'In progress' },
    { id: 'waitingParts', label: 'Waiting parts' },
  ];

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
            <Text style={styles.headerTitle}>Repair Progress</Text>
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
                    console.log('🚀 Overview tab clicked, navigating to jobDetails');
                    persistProgress();
                    onNavigate('jobDetails');
                  } else if (tabType === 'repair') {
                    setActiveTab('repair');
                  } else if (tabType === 'timeline') {
                    console.log('🚀 Timeline tab clicked, navigating to jobTimeline');
                    persistProgress();
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
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Repair in progress</Text>

            {/* Status Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtonContainer}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.statusButton,
                      selectedStatus === option.id && styles.statusButtonSelected,
                    ]}
                    onPress={() => setSelectedStatus(option.id)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        selectedStatus === option.id && styles.statusButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Technician Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Technician notes</Text>
              <TextInput {...nav.props(0)}
                style={[styles.input, styles.notesInput]}
                placeholder="Add notes about the repair"
                placeholderTextColor="#D1D5DB"
                value={technicianNotes}
                onChangeText={setTechnicianNotes}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Final Repair Cost */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Final repair cost</Text>
              <TextInput {...nav.props(1)}
                style={styles.input}
                placeholder="Enter final cost"
                placeholderTextColor="#D1D5DB"
                value={finalCost}
                onChangeText={t => setFinalCost(sanitizeAmount(t))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Submit Repair Progress Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.qualityCheckButton}
            onPress={() =>
              confirmAction({
                title: 'Submit repair progress?',
                message: 'The job will be updated with the status, notes and final cost you entered.',
                confirmText: 'Submit',
                onConfirm: handleSubmitProgress,
              })
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.qualityCheckButtonText}>Submit Repair Progress</Text>
            )}
          </TouchableOpacity>
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
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusButtonSelected: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statusButtonTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notesInput: {
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 100,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
  qualityCheckButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityCheckButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
