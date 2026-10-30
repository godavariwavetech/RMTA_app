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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useSelector, useDispatch } from 'react-redux';

import { SkeletonCardList } from '../../../Components/Skeleton';
import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { updateSaleDraft } from '../../../redux/slices/saleSlice';

const sampleImage = require('../../../Assets/images/sampleMobileImg.png');

// Shared shape for both inventory_list and search_purchase rows.
const mapRow = r => ({
  id: r.id, // inventory_device_id — used when creating the sale
  deviceImage: r.frontimage
    ? { uri: r.frontimage }
    : r.baackimage
    ? { uri: r.baackimage }
    : sampleImage,
  brand: r.device_brand || '',
  model: (r.device_model || '').trim(),
  storage: r.storage || '',
  color: r.color || '',
  imei: r.imei1 || '',
  purchasePrice: r.purchaseprice != null ? Number(r.purchaseprice) : 0,
  condition: r.screen || '—',
  ceirStatus: r.devicestatus === 'not_blocked' ? 'CEIR checked' : 'CEIR not checked',
});

export default function SaleEntryStep2({ onNavigate, buyerData }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const draftDevice = useSelector(state => state.sale.draft.device);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(draftDevice || null);
  const [inventoryDevices, setInventoryDevices] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Load the member's full available inventory once — POST /public_app/inventory_list.
  // Shown whenever the search box is empty.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.member_id) {
        if (active) setLoading(false);
        return;
      }
      const payload = { member_id: user.member_id };
      console.log(
        `[Sale][Step2] inventory_list POST ${ENDPOINTS.INVENTORY_LIST} payload →`,
        payload,
      );
      try {
        const { response, data } = await postJson(ENDPOINTS.INVENTORY_LIST, payload);
        console.log(
          `[Sale][Step2] inventory_list response → HTTP ${response.status}`,
          data,
        );
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          setInventoryDevices(rows.map(mapRow));
        } else if (active) {
          setInventoryDevices([]);
        }
      } catch (e) {
        if (active) setInventoryDevices([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.member_id]);

  // While the search box has text, hit search_purchase for those results
  // instead of filtering the inventory_list locally.
  useEffect(() => {
    let active = true;
    if (!debouncedQuery || !user.member_id) {
      setSearchResults([]);
      return undefined;
    }
    (async () => {
      setSearching(true);
      const payload = { member_id: String(user.member_id), search: debouncedQuery };
      console.log(
        `[Sale][Step2] search_purchase POST ${ENDPOINTS.SEARCH_PURCHASE} payload →`,
        payload,
      );
      try {
        const { response, data } = await postJson(ENDPOINTS.SEARCH_PURCHASE, payload);
        console.log(
          `[Sale][Step2] search_purchase response → HTTP ${response.status}`,
          data,
        );
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          setSearchResults(rows.map(mapRow));
        } else if (active) {
          setSearchResults([]);
        }
      } catch (e) {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.member_id, debouncedQuery]);

  const isSearching = !!debouncedQuery;
  const displayedDevices = isSearching ? searchResults : inventoryDevices;

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleContinue = () => {
    if (selectedDevice && onNavigate) {
      console.log('[Sale][Step2] device selected →', selectedDevice);
      dispatch(updateSaleDraft({ device: selectedDevice }));
      onNavigate('saleEntryStep3', {
        buyerData: buyerData,
        deviceData: selectedDevice,
      });
    }
  };

  const handleBackPress = () => {
    if (selectedDevice) dispatch(updateSaleDraft({ device: selectedDevice }));
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const completedSteps = 2;

  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        selectedDevice?.id === item.id && styles.deviceCardSelected,
      ]}
      onPress={() => handleDeviceSelect(item)}
    >
      <View style={styles.deviceCardContent}>
        <Image
          source={item.deviceImage}
          style={styles.deviceImage}
        />
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Text style={styles.deviceTitle}>
              {item.brand} {item.model}
            </Text>
            {selectedDevice?.id === item.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.deviceSubtitle}>
            {item.storage}GB { item.color}
          </Text>
          <Text style={styles.imeiText}>
            IMEI {item.imei}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSelectedDeviceDetails = () => {
    if (!selectedDevice) return null;

    return (
      <View style={styles.detailsSection}>
        <Text style={styles.detailsTitle}>Available stock</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Purchase price</Text>
          <Text style={styles.detailValue}>₹{selectedDevice.purchasePrice.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Condition</Text>
          <Text style={styles.detailValue}>{selectedDevice.condition}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verification</Text>
          <Text style={styles.detailValue}>{selectedDevice.ceirStatus}</Text>
        </View>
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
        {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Device</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>STEP {completedSteps} OF 6 · DEVICE</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '33.33%' }]} />
          </View>

          {/* Device Banner */}
          <View style={styles.bannerContainer}>
            {selectedDevice ? (
              <Image
                source={selectedDevice.deviceImage}
                style={styles.bannerImage}
              />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Text style={styles.bannerPlaceholderText}>Select a device from inventory</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Section Title */}
            <Text style={styles.sectionTitle}>Choose from your inventory</Text>

            {/* Search Field */}
            <View style={styles.searchContainer}>
              <Image
                source={require('../../../Assets/icons/search.png')}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search model or IMEI"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Device List */}
            <View style={styles.deviceList}>
              {(isSearching ? searching : loading) ? (
                <SkeletonCardList count={3} />
              ) : displayedDevices.length > 0 ? (
                displayedDevices.map((device) => (
                  <View key={device.id}>
                    {renderDeviceItem({ item: device })}
                  </View>
                ))
              ) : (
                <Text style={styles.noResultsText}>No devices available</Text>
              )}
            </View>

            {/* Selected Device Details */}
            {renderSelectedDeviceDetails()}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedDevice && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedDevice}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
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
  bannerContainer: {
    marginHorizontal: wp('5%'),
    marginBottom: hp('2%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    height: hp('20%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  bannerPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('2%'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2%'),
  },
  searchIcon: {
    width: wp('4%'),
    height: wp('4%'),
    marginRight: wp('2%'),
    tintColor: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#1F2937',
  },
  deviceList: {
    marginBottom: hp('2%'),
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    flexDirection: 'row',
  },
  deviceCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#F7F9FC',
  },
  deviceCardContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  deviceImage: {
    width: wp('12%'),
    height: wp('12%'),
    resizeMode: 'contain',
    marginRight: wp('4%'),
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  deviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: hp('0.3%'),
  },
  imeiText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('0.8%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: hp('2%'),
  },
});
