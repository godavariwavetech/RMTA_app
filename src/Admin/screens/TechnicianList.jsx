import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
} from '../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { fetchTechnicians } from '../../redux/slices/techniciansSlice';
import useRefresh from '../../utils/useRefresh';

export default function TechnicianList({ onNavigate }) {
  const { tick, refreshControl } = useRefresh();
  const dispatch = useDispatch();
  const { list, loading } = useSelector(state => state.technicians);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Load the technician list whenever the screen mounts (incl. returning from
  // AddTechnician), so a newly added technician shows up right away.
  useEffect(() => {
    dispatch(fetchTechnicians());
  }, [dispatch, tick]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  // Admin adds technicians: open the dedicated AddTechnician screen. Technicians
  // never self-register — the admin sets their mobile + password there, then
  // they log in via the Technician tab.
  const handleAddTechnician = () => {
    if (onNavigate) {
      onNavigate('addTechnician');
    }
  };

  const handleTechnicianPress = (technician) => {
    if (onNavigate) {
      onNavigate('technicianDetails', { technician });
    }
  };

  // Filter by search text + the selected status tab. Tabs map onto
  // technician_status: Active → 'active', Inactive → 'inactive'. All shows both.
  const query = searchQuery.trim().toLowerCase();
  const filteredTechnicians = list.filter(tech => {
    const name = (tech.full_name || '').toLowerCase();
    const code = (tech.member_code || '').toLowerCase();
    const shop = (tech.shop_name || '').toLowerCase();
    const matchesSearch =
      !query || name.includes(query) || code.includes(query) || shop.includes(query);

    if (!matchesSearch) {
      return false;
    }
    if (selectedStatus === 'Active') {
      return tech.technician_status === 'active';
    }
    if (selectedStatus === 'Inactive') {
      return tech.technician_status === 'inactive';
    }
    return true; // 'All'
  });

  const renderTechnicianItem = ({ item }) => {
    const isActive = item.technician_status === 'active';
    return (
      <TouchableOpacity
        style={styles.technicianItem}
        onPress={() => handleTechnicianPress(item)}
      >
        <View style={styles.technicianIconContainer}>
          <Image
            source={require('../../Assets/icons/profile.png')}
            style={styles.technicianIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.technicianContent}>
          <Text style={styles.technicianName}>
            {item.full_name || 'Unnamed'}
          </Text>
          <Text style={styles.technicianId}>{item.member_code}</Text>
          <Text style={styles.technicianShop}>{item.shop_name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isActive ? '#DCFCE7' : '#FEF3C7' },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: isActive ? '#059669' : '#92400E' },
            ]}
          >
            {item.technician_status}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerTitle}>Technician List</Text>
          <View style={styles.placeholderButton} />
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Find a technician</Text>
          <View style={styles.searchContainer}>
            <Image
              source={require('../../Assets/icons/search.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, ID or shop"
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
            {['All', 'Active', 'Inactive'].map((status) => (
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

        {/* Technicians List */}
        <FlatList refreshControl={refreshControl}
          data={filteredTechnicians}
          keyExtractor={(item) => String(item.user_id)}
          renderItem={renderTechnicianItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {loading ? 'Loading technicians…' : 'No technicians till yet. Add Now.'}
              </Text>
            </View>
          }
        />

        {/* Footer actions */}
        <View style={styles.buttonContainer}>
          {/* Add Technician — admin creates technician accounts */}
          <TouchableOpacity
            style={styles.addTechnicianButton}
            onPress={handleAddTechnician}
          >
            <Text style={styles.addTechnicianButtonText}>Add Technician</Text>
          </TouchableOpacity>

          {/* View Pending Approvals Button — hidden for now */}
          {/* <TouchableOpacity
            style={styles.viewPendingButton}
            onPress={handleViewPendingApprovals}
          >
            <Text style={styles.viewPendingButtonText}>
              View pending approvals
            </Text>
          </TouchableOpacity> */}
        </View>
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
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
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
  listContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  technicianItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  technicianIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  technicianIcon: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#5B8DEE',
  },
  technicianContent: {
    flex: 1,
  },
  technicianName: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.2%'),
  },
  technicianId: {
    fontSize: wp('3%'),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: hp('0.2%'),
  },
  technicianShop: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  statusBadgeText: {
    fontSize: wp('2.5%'),
    fontWeight: '600',
    color: '#059669',
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: wp('6%'),
    color: '#D1D5DB',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  pendingIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  pendingIcon: {
    width: wp('5%'),
    height: wp('5%'),
    tintColor: '#A855F7',
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.2%'),
  },
  pendingCount: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#6B7280',
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
  buttonContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  viewPendingButton: {
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
  viewPendingButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addTechnicianButton: {
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
  addTechnicianButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
