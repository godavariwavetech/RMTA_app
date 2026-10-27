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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

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

export default function JobSheetList({ onNavigate }) {
  const user = useSelector(state => state.auth.user) || {};
  const [selectedNavItem, setSelectedNavItem] = useState('jobs');
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [jobSheets, setJobSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load this member's job sheets whenever the screen mounts.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.member_id) {
        if (active) setLoading(false);
        return;
      }
      try {
        const { response, data } = await postJson(ENDPOINTS.JOB_SHEETS_LIST, {
          member_id: user.member_id,
        });
        if (active && response.ok && data && data.success !== false) {
          setJobSheets(data.data || []);
        }
      } catch (e) {
        // leave the list empty on failure
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
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
  ];

  const filteredJobs = jobSheets.filter((job) => {
    let filterMatch = true;
    if (selectedFilter === 'active') {
      filterMatch = job.status === 'open';
    } else if (selectedFilter === 'inprogress') {
      filterMatch = job.status === 'in_progress';
    } else if (selectedFilter === 'ready') {
      filterMatch = job.status === 'ready';
    }

    let searchMatch = true;
    if (searchText) {
      const q = searchText.toLowerCase();
      searchMatch =
        (job.job_code || '').toLowerCase().includes(q) ||
        `${job.device_brand} ${job.device_model}`.toLowerCase().includes(q) ||
        (job.customer_name || '').toLowerCase().includes(q);
    }

    return filterMatch && searchMatch;
  });

  const renderJobItem = ({ item }) => {
    const meta = STATUS_META[item.status] || { label: item.status, color: '#9CA3AF' };
    const deviceName = [item.device_brand, item.device_model].filter(Boolean).join(' ');
    const price =
      item.estimated_cost != null
        ? `₹${Number(item.estimated_cost).toLocaleString('en-IN')}`
        : '';
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => onNavigate('jobDetails', { jobId: item.id })}
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
            <View style={[styles.statusBadge, { backgroundColor: meta.color + '20' }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
          {/* Find a job section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Find a job</Text>

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
            <View style={styles.filterTabs}>
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
            </View>

            {/* Filter Button */}
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>Filter jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Job List */}
          <View style={styles.jobListContainer}>
            <FlatList
              data={filteredJobs}
              renderItem={renderJobItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  {loading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Text style={styles.emptyText}>No job sheets yet.</Text>
                  )}
                </View>
              }
            />
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
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
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
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
