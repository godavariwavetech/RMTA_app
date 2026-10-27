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

import { Colors } from '../../../Constants/Colors';
import { ENDPOINTS, buildUrl } from '../../../Constants/config';
import { postJson } from '../../../redux/slices/authSlice';

const sampleImage = require('../../../Assets/images/sampleMobileImg.png');

export default function PurchaseAndSaleHistory({ onNavigate, initialTab = 'purchases' }) {
  const user = useSelector(state => state.auth.user) || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Purchases & sales loaded from the backend for this member.
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);

  const fmtDate = v =>
    v
      ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  const fmtAmount = v => (v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '');
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user.member_id) {
        if (active) {
          setLoadingPurchases(false);
          setLoadingSales(false);
        }
        return;
      }
      // Purchases
      try {
        const { response, data } = await postJson(ENDPOINTS.PURCHASES_LIST, {
          member_id: user.member_id,
        });
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          setPurchaseHistory(
            rows.map(r => ({
              id: String(r.id),
              deviceName: [r.device_brand, r.device_model].filter(Boolean).join(' ') || 'Device',
              storage: r.storage || '',
              color: r.color || '',
              imei: r.imei1 || '',
              date: fmtDate(r.created_at),
              seller: r.seller_name || '',
              amount: fmtAmount(r.purchase_price),
              status: cap(r.status),
              image: r.device_photo_path ? { uri: buildUrl(r.device_photo_path) } : sampleImage,
            })),
          );
        }
      } catch (e) {
        // leave list empty on failure
      } finally {
        if (active) setLoadingPurchases(false);
      }
      // Sales
      try {
        const { response, data } = await postJson(ENDPOINTS.SALES_LIST, {
          member_id: user.member_id,
        });
        if (active && response.ok && data && data.success !== false) {
          const rows = Array.isArray(data.data) ? data.data : [];
          setSalesHistory(
            rows.map(r => ({
              id: String(r.id),
              deviceName: [r.device_brand, r.device_model].filter(Boolean).join(' ') || 'Device',
              storage: r.storage || '',
              color: r.color || '',
              imei: r.imei1 || '',
              date: fmtDate(r.sold_at || r.created_at),
              buyer: r.buyer_name || '',
              amount: fmtAmount(r.sale_price),
              status: cap(r.status),
              image: r.device_photo_path ? { uri: buildUrl(r.device_photo_path) } : sampleImage,
            })),
          );
        }
      } catch (e) {
        // leave list empty on failure
      } finally {
        if (active) setLoadingSales(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user.member_id]);

  // Filter data based on search query
  const filterData = (data) => {
    if (!searchQuery.trim()) {
      return data;
    }
    return data.filter(
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

  const renderTransactionCard = ({ item }) => (
    <View style={styles.transactionCard}>
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
        <Text style={[styles.detailValue, styles.statusCompleted]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  const headerTitle = activeTab === 'purchases' ? 'Purchase History' : 'Sale History';
  const sectionTitle = activeTab === 'purchases' ? 'Purchased devices' : 'Completed sales';
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
            {/* Title Section */}
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            <Text style={styles.sectionDescription}>
              All your transactions, in one place.
            </Text>

            {/* Tabs */}
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

            {/* Transactions List */}
            {(activeTab === 'purchases' ? loadingPurchases : loadingSales) ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator color={Colors.primary} />
              </View>
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
                  No {activeTab} found
                </Text>
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
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
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
