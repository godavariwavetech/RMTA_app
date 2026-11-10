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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { useSelector } from 'react-redux';

import { SkeletonJobList } from '../../Components/Skeleton';
import { Colors } from '../../Constants/Colors';
import BottomNav from '../../Components/BottomNav';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import useRefresh from '../../utils/useRefresh';
import PdfSizeModal from '../../Components/PdfSizeModal';
import { shareJobSheetPdf } from '../../utils/jobSheetPdf';
import { canAccessTechnicianMenu } from '../../utils/technicianPermissions';

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

// Status 3 is handed over; status 4 is returned without repair.
const isJobCompleted = job =>
  [3, 4].includes(Number(job.completed_status)) || job.status === 'completed';

// Matches the Home screen's "Jobs today" count: created today, any status.
const isJobToday = job => {
  if (!job.created_at) return false;
  const created = new Date(job.created_at);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
};

export default function JobSheetList({ onNavigate, initialFilter }) {
  const insets = useSafeAreaInsets();
  const { tick, refreshControl } = useRefresh();
  const user = useSelector(state => state.auth.user) || {};
  const canCreateJobSheet = canAccessTechnicianMenu(user, 1);
  const [selectedNavItem, setSelectedNavItem] = useState('jobs');
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(initialFilter || 'active');
  const [jobSheets, setJobSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  // "Share job sheet PDF": the card asks for a paper size, then the PDF is built and the
  // share sheet opens straight away (no separate screen).
  const [pdfJob, setPdfJob] = useState(null); // job waiting for a size choice
  const [pdfBusyId, setPdfBusyId] = useState(null); // job whose PDF is being made

  const sharePdf = async (job, sizeKey) => {
    setPdfBusyId(job.id);
    try {
      const result = await shareJobSheetPdf(job, sizeKey);
      if (result.saved) Alert.alert('PDF saved', `Saved to:\n${result.filePath}`);
    } catch (err) {
      Alert.alert('Could not create PDF', err.message || 'Please try again.');
    } finally {
      setPdfBusyId(null);
    }
  };

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
  }, [user.member_id, tick]);

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
    { id: 'today', label: 'Today' },
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
  // filters below only apply to the jobs still in progress. "Today" is a
  // date filter rather than a status, so it narrows both sections instead of
  // only the open one.
  const completedJobs = jobSheets.filter(
    job => isJobCompleted(job) && matchesSearch(job) && (selectedFilter !== 'today' || isJobToday(job)),
  );

  const openJobMatches = (job, filterId) => {
    if (isJobCompleted(job)) return false;
    if (filterId === 'today') return isJobToday(job);
    if (filterId === 'active') return job.status === 'open' || job.status === 'draft';
    if (filterId === 'inprogress') return job.status === 'in_progress';
    if (filterId === 'ready') return job.status === 'ready';
    if (filterId === 'completed') return false;
    return true;
  };

  const filteredJobs = jobSheets.filter(job => openJobMatches(job, selectedFilter) && matchesSearch(job));

  // Counts shown on the filter chips (ignoring the search text). "Today"
  // counts every status, matching the Home screen's "Jobs today" card.
  const countFor = id => {
    if (id === 'completed') return jobSheets.filter(isJobCompleted).length;
    if (id === 'all') return jobSheets.length;
    if (id === 'today') return jobSheets.filter(isJobToday).length;
    return jobSheets.filter(job => openJobMatches(job, id)).length;
  };

  const showOpenSection = selectedFilter !== 'completed';
  const showCompletedSection =
    (selectedFilter === 'all' || selectedFilter === 'completed' || selectedFilter === 'today') &&
    completedJobs.length > 0;

  const renderJobItem = item => {
    const completed = isJobCompleted(item);
    const meta = Number(item.completed_status) === 4
      ? { label: 'Returned without repair', color: '#B45309' }
      : completed
      ? STATUS_META.completed
      : STATUS_META[item.status] || { label: item.status, color: '#9CA3AF' };
    const deviceName = [item.device_brand, item.device_model].filter(Boolean).join(' ') || 'Device';
    const details = [item.customer_name, item.problem_description].filter(Boolean).join(' · ');
    const price =
      item.estimated_cost != null
        ? `₹${Number(item.estimated_cost).toLocaleString('en-IN')}`
        : '';
    const summaryOf = () =>
      ({
        ...Object.fromEntries(
          Object.entries(item).filter(([, v]) => !(typeof v === 'string' && v.length > 300)),
        ),
        customer_photo:
          item.customer_photo ||
          item.customer_image ||
          (item.customer && (item.customer.customer_photo || item.customer.customer_image)) ||
          null,
      });
    return (
      <View key={item.id} style={styles.jobCard}>
        <View style={[styles.stripe, { backgroundColor: meta.color }]} />
        <View style={styles.cardMain}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              // Pass the list row too, so details can fall back to it if the
              // details request fails. Keep the customer photo even if it is base64.
              onNavigate('jobDetails', { jobId: item.id, jobSummary: summaryOf() });
            }}
          >
            <View style={styles.cardTop}>
              <View style={[styles.deviceTile, { backgroundColor: meta.color + '22' }]}>
                <Text style={styles.deviceTileText}>📱</Text>
              </View>
              <View style={styles.cardTitles}>
                <Text style={styles.deviceName} numberOfLines={1}>
                  {deviceName}
                </Text>
                {!!details && (
                  <Text style={styles.jobDetails} numberOfLines={2}>
                    {details}
                  </Text>
                )}
              </View>
              {(completed || item.status !== 'draft') && (
                <View style={[styles.statusBadge, { backgroundColor: meta.color + '22' }]}>
                  <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardMeta}>
              <View style={styles.codeChip}>
                <Text style={styles.codeChipText}>{item.job_code || `#${item.id}`}</Text>
              </View>
              {!!price && <Text style={styles.price}>{price}</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.jobPdfAction}
            activeOpacity={0.8}
            disabled={pdfBusyId !== null}
            onPress={() => setPdfJob(summaryOf())}
          >
            <Text style={styles.jobPdfActionText}>
              {pdfBusyId === item.id ? 'Creating PDF…' : '📄  Share job sheet PDF'}
            </Text>
            {pdfBusyId === item.id ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <Text style={styles.jobPdfArrow}>›</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalJobs = jobSheets.length;

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Navy header with the title, a count and the search field */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Job sheets</Text>
              <Text style={styles.headerSub}>
                {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} in total
              </Text>
            </View>
          </View>
          <View style={styles.searchContainer}>
            <Text style={styles.searchGlyph}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, device or job ID"
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
            {!!searchText && (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Filter chips with counts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabs}
          >
            {filters.map(filter => {
              const on = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterTab, on && styles.filterTabActive]}
                  onPress={() => setSelectedFilter(filter.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterTabText, on && styles.filterTabTextActive]}>{filter.label}</Text>
                  <View style={[styles.countBubble, on && styles.countBubbleOn]}>
                    <Text style={[styles.countBubbleText, on && styles.countBubbleTextOn]}>{countFor(filter.id)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Job list */}
          <View style={styles.jobListContainer}>
            {loading ? (
              <SkeletonJobList count={5} />
            ) : (
              <>
                {showOpenSection && filteredJobs.map(renderJobItem)}

                {showOpenSection && filteredJobs.length === 0 && !showCompletedSection && (
                  <View style={styles.emptyBox}>
                    <View style={styles.emptyCircle}>
                      <Text style={styles.emptyGlyph}>🛠️</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No job sheets here</Text>
                    <Text style={styles.emptyText}>Create a job sheet and it will show up in this list.</Text>
                  </View>
                )}

                {showCompletedSection && (
                  <View style={styles.completedSection}>
                    <View style={styles.completedHeadRow}>
                      <Text style={styles.completedHeading}>Completed jobs</Text>
                      <View style={styles.completedCount}>
                        <Text style={styles.completedCountText}>{completedJobs.length}</Text>
                      </View>
                    </View>
                    {completedJobs.map(job => renderJobItem(job))}
                  </View>
                )}

                {selectedFilter === 'completed' && completedJobs.length === 0 && (
                  <View style={styles.emptyBox}>
                    <View style={styles.emptyCircle}>
                      <Text style={styles.emptyGlyph}>✅</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No completed jobs yet</Text>
                    <Text style={styles.emptyText}>Finished and handed-over jobs appear here.</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* New job sheet: a floating button */}
        {canCreateJobSheet && (
          <View
            style={[
              styles.newJobButtonContainer,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 0) + 20 },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.newJobButton}
              activeOpacity={0.9}
              onPress={() => onNavigate('createJobSheetStep1', { fresh: true })}
            >
              <Text style={styles.newJobPlus}>＋</Text>
              <Text style={styles.newJobButtonText}>New job sheet</Text>
            </TouchableOpacity>
          </View>
        )}

        <PdfSizeModal
          visible={pdfJob !== null}
          onSelect={sizeKey => {
            const job = pdfJob;
            setPdfJob(null);
            if (job) sharePdf(job, sizeKey);
          }}
          onClose={() => setPdfJob(null)}
        />

        {/* Bottom Navigation */}
        {/* <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} /> */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB', flexDirection: 'column' },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, marginBottom: 14 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  backButtonText: { color: '#FFFFFF', fontSize: 32, lineHeight: 36, includeFontPadding: false },
  headerTitles: { marginLeft: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchGlyph: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  searchClear: { fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  content: { flex: 1 },
  filterTabs: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  filterTabTextActive: { color: '#FFFFFF' },
  countBubble: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBubbleOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countBubbleText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  countBubbleTextOn: { color: '#FFFFFF' },

  jobListContainer: { paddingHorizontal: 14, paddingTop: 10 },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 9,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  stripe: { width: 5 },
  cardMain: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 },
  deviceTile: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  deviceTileText: { fontSize: 18 },
  cardTitles: { flex: 1, marginRight: 8 },
  deviceName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  jobDetails: { fontSize: 12, lineHeight: 16, color: '#64748B', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 8,
  },
  codeChip: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  codeChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  price: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  jobPdfAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
  },
  jobPdfActionText: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  jobPdfArrow: { fontSize: 20, lineHeight: 22, color: Colors.secondary },

  completedSection: { marginTop: 4 },
  completedHeadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 4 },
  completedHeading: { fontSize: 14, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  completedCount: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  completedCountText: { fontSize: 11, fontWeight: '800', color: '#15803D' },

  emptyBox: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyGlyph: { fontSize: 42 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  bottomSpacer: { height: 110 },
  newJobButtonContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#F4F6FB',
  },
  newJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  newJobPlus: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', marginRight: 10, includeFontPadding: false },
  newJobButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
