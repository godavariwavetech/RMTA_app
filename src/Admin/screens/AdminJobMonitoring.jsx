import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';

// Map a raw job_sheets status to a display label, badge colors, and the
// Active/Completed filter group.
const statusMeta = s => {
  switch (s) {
    case 'in_progress': return { label: 'In progress', bg: '#FEF3C7', color: '#92400e', group: 'active' };
    case 'ready': return { label: 'Ready', bg: '#DCFCE7', color: '#065f46', group: 'completed' };
    case 'completed': return { label: 'Completed', bg: '#E3F2FD', color: '#1e40af', group: 'completed' };
    case 'waiting_parts': return { label: 'Waiting parts', bg: '#FEF3C7', color: '#92400e', group: 'active' };
    case 'quality_check': return { label: 'Quality check', bg: '#EDE9FE', color: '#5B21B6', group: 'active' };
    case 'cancelled': return { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', group: 'completed' };
    case 'open': return { label: 'Open', bg: '#F3F4F6', color: '#374151', group: 'active' };
    case 'draft': return { label: 'Draft', bg: '#F3F4F6', color: '#374151', group: 'active' };
    default: return { label: s || '—', bg: '#F3F4F6', color: '#374151', group: 'active' };
  }
};

export default function AdminJobMonitoring({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Load every job across the association, with technician + shop details.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await postJson(ENDPOINTS.ADMIN_JOBS_LIST, {});
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          setJobs(rows.map(r => {
            const meta = statusMeta(r.status);
            const amt = r.final_cost != null ? r.final_cost : (r.estimated_cost != null ? r.estimated_cost : 0);
            return {
              id: r.id,
              jobId: r.job_code || `JS-${r.id}`,
              device: [r.device_brand, r.device_model].filter(Boolean).join(' ') || 'Device',
              issue: r.problem_description || r.repair_category || '—',
              technician: r.technician_name || '—',
              shop: r.shop_name || '—',
              amount: `₹${Number(amt).toLocaleString('en-IN')}`,
              status: meta.label,
              statusGroup: meta.group,
              statusColor: meta.bg,
              statusTextColor: meta.color,
            };
          }));
        }
      } catch (e) {
        // leave list empty on failure
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleJobPress = (job) => {
    setSelectedJob(job);
  };

  const handleOpenJobDetails = () => {
    if (onNavigate && selectedJob) {
      onNavigate('jobDetails', { jobId: selectedJob.id });
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.jobId.toLowerCase().includes(q) ||
      job.device.toLowerCase().includes(q) ||
      job.technician.toLowerCase().includes(q) ||
      job.shop.toLowerCase().includes(q);

    if (selectedStatus === 'All') {
      return matchesSearch;
    }
    return matchesSearch && job.statusGroup === selectedStatus.toLowerCase();
  });

  const renderJobItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.jobItem,
        selectedJob?.id === item.id && styles.jobItemActive,
      ]}
      onPress={() => handleJobPress(item)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobId}>{item.jobId}</Text>
      </View>

      <Text style={styles.jobDevice}>{item.device}</Text>
      <Text style={styles.jobIssue}>{item.issue}</Text>

      {/* Technician who created / owns the job */}
      <View style={styles.jobTechRow}>
        <Image
          source={require('../../Assets/icons/storeIcon.png')}
          style={styles.jobTechIcon}
          resizeMode="contain"
        />
        <View style={styles.jobTechInfo}>
          <Text style={styles.jobTechName}>{item.technician}</Text>
          <Text style={styles.jobShop}>{item.shop}</Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.jobAmount}>{item.amount}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.statusColor },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: item.statusTextColor },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar
        backgroundColor="#F5F5F5"
        barStyle="dark-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Job Monitoring</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Search jobs</Text>
            <View style={styles.searchContainer}>
              <Image
                source={require('../../Assets/icons/search.png')}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search job, member or device"
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterButtons}>
              {['All', 'Active', 'Completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    selectedStatus === status && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedStatus === status && styles.filterButtonTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Jobs List */}
          <View style={styles.jobsListContainer}>
            <FlatList
              data={filteredJobs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderJobItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No jobs found</Text>
                </View>
              }
            />
          </View>

          {/* Job Details Section */}
          {selectedJob && (
            <View style={styles.jobDetailsSection}>
              <Text style={styles.jobDetailsTitle}>Technician</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Member</Text>
                <Text style={styles.detailValue}>{selectedJob.technician}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shop</Text>
                <Text style={styles.detailValue}>{selectedJob.shop}</Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Open Job Details Button */}
        {selectedJob && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.openDetailsButton}
              onPress={handleOpenJobDetails}
            >
              <Text style={styles.openDetailsButtonText}>Open job details</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  backButtonText: {
    fontSize: wp('10%'),
    // color: Colors.secondary,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: wp('8%'),
  },
  searchSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  searchLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: hp('1%'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp('3%'),
  },
  searchIcon: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#9CA3AF',
    marginRight: wp('2%'),
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: '#1F2937',
  },
  filterSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  filterLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: hp('1%'),
  },
  filterButtons: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  filterButton: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: '#5B8DEE',
  },
  filterButtonText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  jobsListContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  jobItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  jobItemActive: {
    borderColor: Colors.secondary,
    borderWidth: 2,
    backgroundColor: '#F0F4FF',
  },
  jobHeader: {
    marginBottom: hp('1%'),
  },
  jobId: {
    fontSize: wp('3.2%'),
    fontWeight: '500',
    color: '#5B8DEE',
  },
  jobDevice: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.3%'),
  },
  jobIssue: {
    fontSize: wp('3.2%'),
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: hp('1%'),
  },
  jobTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: '#F9FAFB',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('1%'),
  },
  jobTechIcon: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#6B7280',
  },
  jobTechInfo: {
    flex: 1,
  },
  jobTechName: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  jobShop: {
    fontSize: wp('2.9%'),
    fontWeight: '400',
    color: '#6B7280',
    marginTop: hp('0.2%'),
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobAmount: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  statusBadgeText: {
    fontSize: wp('2.5%'),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobDetailsSection: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobDetailsTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  emptyStateText: {
    fontSize: wp('3.8%'),
    color: '#6B7280',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  openDetailsButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  openDetailsButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
