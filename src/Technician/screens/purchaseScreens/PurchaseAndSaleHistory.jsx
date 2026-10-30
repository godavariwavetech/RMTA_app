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

import { SkeletonCardList } from '../../../Components/Skeleton';
import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS, buildUrl } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';
import { setPhotos } from '../../../utils/photoCache';
import DatePickerModal, { formatDisplayDate } from '../../../Components/DatePickerModal';

const sampleImage = require('../../../Assets/images/sampleMobileImg.png');

// "YYYY-MM-DD" (local) for a raw API date, so it compares with the picker's value.
const parseLocalDate = v => {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toDateKey = raw => {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Longer string values are treated as embedded blobs (base64) and dropped.
const MAX_FIELD_LENGTH = 300;

export default function PurchaseAndSaleHistory({ onNavigate, initialTab = 'purchases', singleTab = false }) {
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Purchases & sales loaded from the backend for this member.
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadError, setLoadError] = useState('');
  // Date range filter, "YYYY-MM-DD" strings ('' = not set).
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pickerFor, setPickerFor] = useState(null); // 'from' | 'to' | null
  // Purchases only: 'all' | 'available' | 'soldout'
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  const fmtDate = v =>
    v
      ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  const fmtAmount = v => (v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '');
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  // Log rows compactly: long values (e.g. base64 images) are truncated so
  // logging a large response doesn't block the JS thread.
  const logRows = (label, rows) => {
    const short = rows.slice(0, 3).map(r =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [
          k,
          typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}...(${v.length})` : v,
        ]),
      ),
    );
    console.log(`[${label}] ${rows.length} rows, first:`, JSON.stringify(short));
  };

  useEffect(() => {
    let active = true;

    // Fetch one list; the two lists load in parallel and only the tab(s) the
    // screen actually shows are requested.
    const load = async (endpoint, label, mapRow, setRows, setLoading) => {
      try {
        const { response, data } = await postJson(endpoint, {
          member_id: user.member_id,
        });
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          logRows(label, rows);
          setRows(rows.map(mapRow));
        } else if (active) {
          console.log(`[${label}] request failed:`, response.status, data && data.message);
          setLoadError((data && data.message) || `Could not load ${label} (${response.status}).`);
        }
      } catch (e) {
        console.log(`[${label}] request error:`, e.message);
        if (active) {
          setLoadError('Could not reach the server. Check your connection and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    // Rows can carry base64 image blobs. Drop long values so they never reach
    // React state, navigation params or <Text>, which freezes the app.
    const isLong = v => typeof v === 'string' && v.length > MAX_FIELD_LENGTH;
    const slim = r =>
      Object.fromEntries(Object.entries(r).filter(([, v]) => !isLong(v)));

    // Photos arrive as base64 JPEGs (no data: prefix) or short server paths.
    const PHOTO_FIELDS = [
      ['frontimage', 'Front photo'],
      ['baackimage', 'Back photo'],
      ['device_image', 'Device photo'],
    ];
    const extractPhotos = r =>
      PHOTO_FIELDS.filter(([k]) => typeof r[k] === 'string' && r[k]).map(([k, label]) => ({
        label,
        uri: isLong(r[k])
          ? r[k].startsWith('data:') ? r[k] : `data:image/jpeg;base64,${r[k]}`
          : buildUrl(r[k]),
      }));

    // Rows can repeat the same id (joined tables), so the list key includes
    // the position as well.
    const mapCommon = (r, index, type) => {
      const photos = extractPhotos(r);
      const id = `${r.id}-${index}`;
      setPhotos(`${type}-${id}`, photos);
      return {
        id,
        raw: slim(r),
        dateKey: toDateKey(
          type === 'sales'
            ? r.sold_at || r.sale_date || r.created_at
            : r.purchase_date || r.created_date || r.created_at,
        ),
        deviceName: [r.device_brand, r.device_model].filter(Boolean).join(' ').trim() || 'Device',
        storage: r.storage || '',
        color: r.color || '',
        imei: r.imei1 || '',
        // Purchases: `available` 0 (or missing) → Available, 1 → Sold out.
        soldOut: type === 'purchases' && Number(r.available) === 1,
        status:
          type === 'purchases'
            ? Number(r.available) === 1
              ? 'Sold out'
              : 'Available'
            : cap(r.status || r.devicestatus) || 'Sold',
        image: photos.length ? { uri: photos[0].uri } : sampleImage,
      };
    };

    setLoadError('');
    setLoadingPurchases(true);
    setLoadingSales(true);

    if (!user.member_id) {
      setLoadingPurchases(false);
      setLoadingSales(false);
      return undefined;
    }

    if (!singleTab || initialTab === 'purchases') {
      load(
        ENDPOINTS.GET_PURCHASE_SHEETS,
        'purchases',
        (r, i) => ({
          ...mapCommon(r, i, 'purchases'),
          date: fmtDate(r.purchase_date || r.created_date || r.created_at),
          seller: r.seller_name || r.customer_name || '',
          amount: fmtAmount(r.purchase_price ?? r.purchaseprice),
        }),
        setPurchaseHistory,
        setLoadingPurchases,
      );
    } else {
      setLoadingPurchases(false);
    }
    if (!singleTab || initialTab === 'sales') {
      load(
        ENDPOINTS.GET_SALES_SHEETS,
        'sales',
        (r, i) => ({
          ...mapCommon(r, i, 'sales'),
          date: fmtDate(r.sold_at || r.sale_date || r.created_at),
          buyer: r.buyer_name || r.customer_name || '',
          amount: fmtAmount(r.sale_price),
        }),
        setSalesHistory,
        setLoadingSales,
      );
    } else {
      setLoadingSales(false);
    }

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.member_id, reloadKey]);

  // Filter data based on search query
  const filterData = (data) => {
    // Date range (inclusive). Rows without a usable date are hidden once a
    // range is set.
    const inRange = data.filter(item => {
      if (fromDate && (!item.dateKey || item.dateKey < fromDate)) return false;
      if (toDate && (!item.dateKey || item.dateKey > toDate)) return false;
      if (activeTab === 'purchases') {
        if (availabilityFilter === 'available' && item.soldOut) return false;
        if (availabilityFilter === 'soldout' && !item.soldOut) return false;
      }
      return true;
    });
    if (!searchQuery.trim()) {
      return inRange;
    }
    return inRange.filter(
      (item) =>
        item.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.imei.includes(searchQuery) ||
        (activeTab === 'purchases' && item.seller.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activeTab === 'sales' && item.buyer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const displayData = activeTab === 'purchases' ? filterData(purchaseHistory) : filterData(salesHistory);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleNewTransaction = () => {
    if (onNavigate) {
      if (activeTab === 'purchases') {
        onNavigate('purchaseEntryStep1');
      } else {
        onNavigate('saleEntryStep1');
      }
    }
  };

  const handleOpenDetails = item => {
    if (onNavigate) {
      // The photo stays out of navigation params; the details screen reads it
      // from the photo cache by type + id.
      const { image, ...rest } = item;
      onNavigate('transactionDetails', { type: activeTab, item: rest });
    }
  };

  const renderTransactionCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.transactionCard}
      onPress={() => handleOpenDetails(item)}
    >
      <View style={styles.deviceCardHeader}>
        <Image
          source={item.image}
          style={styles.deviceImage}
        />
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.deviceName}</Text>
          <Text style={styles.deviceDetails}>
            {item.storage} · {item.color}
          </Text>
          <Text style={styles.imeiText}>IMEI {item.imei}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{item.date}</Text>

      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>
          {activeTab === 'purchases' ? 'Seller' : 'Buyer'}
        </Text>
        <Text style={styles.detailValue}>
          {activeTab === 'purchases' ? item.seller : item.buyer}
        </Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>Amount</Text>
        <Text style={styles.detailValue}>{item.amount}</Text>
      </View>

      <View style={[styles.detailsRow, styles.lastDetailsRow]}>
        <Text style={styles.detailLabel}>Status</Text>
        <Text
          style={[
            styles.detailValue,
            styles.statusCompleted,
            item.soldOut && styles.statusSoldOut,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const headerTitle = activeTab === 'purchases' ? 'Purchase History' : 'Sale History';
  const buttonText = activeTab === 'purchases' ? 'New purchase' : 'New sale';

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
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Content */}
          <View style={styles.content}>
            {/* Tabs */}
            {!singleTab && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'purchases' && styles.tabActive,
                ]}
                onPress={() => setActiveTab('purchases')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'purchases' && styles.tabTextActive,
                  ]}
                >
                  Purchases
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'sales' && styles.tabActive,
                ]}
                onPress={() => setActiveTab('sales')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'sales' && styles.tabTextActive,
                  ]}
                >
                  Sales
                </Text>
              </TouchableOpacity>
            </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Image
                source={require('../../../Assets/icons/search.png')}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search device, name or IMEI"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Availability filter (purchases only) */}
            {activeTab === 'purchases' && (
              <View style={styles.availabilityRow}>
                {[
                  ['all', 'All'],
                  ['available', 'Available'],
                  ['soldout', 'Sold out'],
                ].map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.availabilityChip,
                      availabilityFilter === key && styles.availabilityChipActive,
                    ]}
                    onPress={() => setAvailabilityFilter(key)}
                  >
                    <Text
                      style={[
                        styles.availabilityChipText,
                        availabilityFilter === key && styles.availabilityChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date range filter */}
            <View style={styles.dateFilterRow}>
              {[
                ['from', 'From date', fromDate],
                ['to', 'To date', toDate],
              ].map(([key, placeholder, value]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.dateFilterField}
                  activeOpacity={0.7}
                  onPress={() => setPickerFor(key)}
                >
                  <Text style={styles.dateFilterLabel}>{placeholder}</Text>
                  <Text style={[styles.dateFilterValue, !value && styles.dateFilterPlaceholder]}>
                    {formatDisplayDate(value) || 'Select'}
                  </Text>
                </TouchableOpacity>
              ))}
              {(!!fromDate || !!toDate) && (
                <TouchableOpacity
                  style={styles.dateFilterClear}
                  onPress={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                >
                  <Text style={styles.dateFilterClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <DatePickerModal
              visible={pickerFor !== null}
              value={pickerFor === 'from' ? fromDate : toDate}
              minDate={pickerFor === 'to' && fromDate ? parseLocalDate(fromDate) : null}
              maxDate={pickerFor === 'from' && toDate ? parseLocalDate(toDate) : null}
              onConfirm={date => {
                if (pickerFor === 'from') setFromDate(date);
                else setToDate(date);
                setPickerFor(null);
              }}
              onClose={() => setPickerFor(null)}
            />

            {/* Transactions List */}
            {(activeTab === 'purchases' ? loadingPurchases : loadingSales) ? (
              <SkeletonCardList count={3} />
            ) : displayData.length > 0 ? (
              <FlatList
                data={displayData}
                renderItem={renderTransactionCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {loadError || `No ${activeTab} found`}
                </Text>
                {loadError ? (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setReloadKey(k => k + 1)}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* New Transaction Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.newTransactionButton}
            onPress={handleNewTransaction}
          >
            <Text style={styles.newTransactionButtonText}>{buttonText}</Text>
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
    paddingVertical: hp('1.2%'),
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 44,
  },
  content: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  tab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2F5DDC',
    borderWidth: 2,
  },
  tabText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2F5DDC',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: hp('2%'),
  },
  dateFilterField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: 8,
  },
  dateFilterLabel: { fontSize: 11, color: '#9CA3AF' },
  dateFilterValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  dateFilterPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  dateFilterClear: { justifyContent: 'center', paddingHorizontal: 4 },
  dateFilterClearText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.6%'),
    marginBottom: hp('2%'),
  },
  searchIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    marginRight: wp('2%'),
    tintColor: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: '#1F2937',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deviceImage: {
    width: wp('16%'),
    height: hp('6%'),
    resizeMode: 'contain',
    marginRight: wp('3%'),
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  deviceDetails: {
    fontSize: wp('3%'),
    color: '#6B7280',
    marginBottom: 2,
  },
  imeiText: {
    fontSize: wp('2.8%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dateText: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('1.5%'),
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.8%'),
  },
  lastDetailsRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: wp('3.2%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  statusCompleted: {
    color: '#21884cff',
  },
  statusSoldOut: {
    color: '#B91C1C',
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: hp('1.5%'),
  },
  availabilityChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  availabilityChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  availabilityChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  availabilityChipTextActive: { color: '#FFFFFF' },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
  },
  emptyStateText: {
    fontSize: wp('4%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: hp('3%'),
  },
  buttonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  newTransactionButton: {
    backgroundColor: '#2F5DDC',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTransactionButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
