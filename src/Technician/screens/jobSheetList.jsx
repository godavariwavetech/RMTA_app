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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import { SkeletonJobList } from '../../Components/Skeleton';
import { Colors } from '../../Constants/Colors';
import BottomNav from '../../Components/BottomNav';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';

// DB status → display label + colour for the card badge.
const STATUS_META = {
  draft: { label: 'Draft', color: '#9CA3AF' },
  open: { label: 'Active', color: '#10B981' },
  in_progress: { label: 'In progress', color: '#FCD34D' },
  waiting_parts: { label: 'Waiting parts', color: '#F59E0B' },
  quality_check: { label: 'Quality check', color: '#8B5CF6' },
  ready: { label: 'Ready', color: '#3B82F6' },
  completed: { label: 'Completed', color: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
};

// A job is finished once the server's completed_status reaches 3 (handed over).
const isJobCompleted = job =>
  Number(job.completed_status) === 3 || job.status === 'completed';

export default function JobSheetList({ onNavigate }) {
  const user = useSelector(state => state.auth.user) || {};
  const [selectedNavItem, setSelectedNavItem] = useState('jobs');
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('active');
  const [jobSheets, setJobSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Jobs that job_sheets_list knows about but get_job_sheets doesn't (it can
  // return an empty list). Each one is enriched from job_sheet_details when
  // that works (for completed_status etc.); otherwise the list row is kept.
  const loadMissingJobs = async knownRows => {
    try {
      const { response, data } = await postJson(ENDPOINTS.JOB_SHEETS_LIST, {
        member_id: user.member_id,
      });
      if (!response.ok || !data || !Array.isArray(data.data)) return [];
      const known = new Set(knownRows.map(row => String(row.id)));
      const missing = data.data.filter(row => !known.has(String(row.id))).slice(0, 30);
      const details = await Promise.all(
        missing.map(async row => {
          try {
            const res = await postJson(ENDPOINTS.JOB_SHEET_DETAILS, { job_id: row.id });
            return res.response.ok && res.data && res.data.data
              ? { ...row, ...res.data.data }
              : row;
          } catch (e) {
            return row;
          }
        }),
      );
      return details;
    } catch (e) {
      return [];
    }
  };

  // Load this member's job sheets whenever the screen mounts.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.member_id) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { response, data } = await postJson(ENDPOINTS.GET_JOB_SHEETS, {
          member_id: user.member_id,
        });
        // Log the response with long values (e.g. base64) truncated.
        console.log(
          `[jobs] member_id=${user.member_id} HTTP ${response.status}:`,
          JSON.stringify(data, (k, v) =>
            typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}...(${v.length})` : v,
          2),
        );
        if (active && response.ok && data && data.success !== false) {
          const rows = data.data || [];
          setJobSheets(rows);
          // get_job_sheets can leave jobs out (completed ones, or everything),
          // so add whatever the older job_sheets_list returns on top.
          const extra = await loadMissingJobs(rows);
          if (active && extra.length) setJobSheets([...rows, ...extra]);
        }
      } catch (e) {
        console.log('[jobs] request error:', e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.member_id]);

  const handleNavigation = (screen) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'inprogress', label: 'In progress' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Completed' },
  ];

  const matchesSearch = job => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      (job.job_code || '').toLowerCase().includes(q) ||
      `${job.device_brand} ${job.device_model}`.toLowerCase().includes(q) ||
      (job.customer_name || '').toLowerCase().includes(q)
    );
  };

  // Finished jobs live in their own "Completed jobs" section; the status
  // filters below only apply to the jobs still in progress.
  const completedJobs = jobSheets.filter(job => isJobCompleted(job) && matchesSearch(job));

  const filteredJobs = jobSheets.filter((job) => {
    if (isJobCompleted(job)) return false;
    let filterMatch = true;
    if (selectedFilter === 'active') {
      filterMatch = job.status === 'open' || job.status === 'draft';
    } else if (selectedFilter === 'inprogress') {
      filterMatch = job.status === 'in_progress';
    } else if (selectedFilter === 'ready') {
      filterMatch = job.status === 'ready';
    } else if (selectedFilter === 'completed') {
      filterMatch = false;
    }
    return filterMatch && matchesSearch(job);
  });

  const showOpenSection = selectedFilter !== 'completed';
  const showCompletedSection =
    (selectedFilter === 'all' || selectedFilter === 'completed') && completedJobs.length > 0;

  const renderJobItem = ({ item }) => {
    const completed = isJobCompleted(item);
    const meta = completed
      ? STATUS_META.completed
      : STATUS_META[item.status] || { label: item.status, color: '#9CA3AF' };
    const deviceName = [item.device_brand, item.device_model].filter(Boolean).join(' ');
    const price =
      item.estimated_cost != null
        ? `₹${Number(item.estimated_cost).toLocaleString('en-IN')}`
        : '';
    return (
      <View style={styles.jobCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
          // Pass the list row too, so details can fall back to it if the
          // details request fails. Long values (e.g. base64) are dropped.
          const summary = Object.fromEntries(
            Object.entries(item).filter(
              ([, v]) => !(typeof v === 'string' && v.length > 300),
            ),
          );
            onNavigate('jobDetails', { jobId: item.id, jobSummary: summary });
          }}
        >
        <View style={styles.jobHeader}>
          <Text style={styles.jobId}>{item.job_code}</Text>
        </View>
        <View style={styles.jobBody}>
          <Text style={styles.deviceName}>{deviceName}</Text>
          <Text style={styles.jobDetails}>
            {[item.customer_name, item.problem_description].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.jobFooter}>
            <Text style={styles.price}>{price}</Text>
            {(completed || item.status !== 'draft') && (
              <View style={[styles.statusBadge, { backgroundColor: meta.color + '20' }]}>
                <Text style={[styles.statusText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.jobPdfAction}
          onPress={() => {
            const summary = Object.fromEntries(
              Object.entries(item).filter(([, value]) => !(typeof value === 'string' && value.length > 300)),
            );
            onNavigate('createJobSheetStep8', { job: summary, summary, pdfOnly: true });
          }}
        >
          <Text style={styles.jobPdfActionText}>Share job sheet PDF</Text>
          <Text style={styles.jobPdfArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Sheet List</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          <View style={styles.section}>
            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Image
                source={require('../../Assets/icons/clipboard.png')}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, device or job ID"
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabs}
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.id && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === filter.id &&
                        styles.filterTabTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Job List */}
          <View style={styles.jobListContainer}>
            {loading ? (
              <SkeletonJobList count={5} />
            ) : (
              <>
                {showOpenSection && (
                  <FlatList
                    data={filteredJobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    ListEmptyComponent={
                      completedJobs.length === 0 || selectedFilter !== 'all' ? (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyText}>No job sheets yet.</Text>
                        </View>
                      ) : null
                    }
                  />
                )}

                {showCompletedSection && (
                  <View style={styles.completedSection}>
                    <Text style={styles.completedHeading}>
                      Completed jobs ({completedJobs.length})
                    </Text>
                    {completedJobs.map(job => (
                      <View key={`completed-${job.id}`}>{renderJobItem({ item: job })}</View>
                    ))}
                  </View>
                )}

                {selectedFilter === 'completed' && completedJobs.length === 0 && (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No completed jobs yet.</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* New Job Sheet Button */}
        <View style={styles.newJobButtonContainer}>
          <TouchableOpacity style={styles.newJobButton} onPress={() => onNavigate('createJobSheetStep1', { fresh: true })}>
            <Text style={styles.newJobButtonText}>+ New job sheet</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        {/* <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} /> */}
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
    // padding: 8,
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('0%'),
    // width: 44,
    // height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  section: {
    marginBottom: hp('2%'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 8,
    tintColor: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingRight: 8,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#2F5DDC',
    borderColor: '#2F5DDC',
    borderWidth: 1,
    borderColor: '#ffffffff',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  completedSection: {
    marginTop: 8,
  },
  completedHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  jobListContainer: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  jobPdfAction: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobPdfActionText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  jobPdfArrow: { color: Colors.primary, fontSize: 20 },
  jobHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  jobId: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  jobBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobDetails: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  newJobButtonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  newJobButton: {
    backgroundColor: '#2F5DDC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newJobButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
