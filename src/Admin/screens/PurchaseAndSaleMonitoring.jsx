import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS, buildUrl } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import useRefresh from '../../utils/useRefresh';

const sampleImage = require('../../Assets/images/sampleMobileImg.png');
const money = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const deviceName = (brand, model) => [brand, model].filter(Boolean).join(' ') || 'Device';
const photoSource = path => (path ? { uri: buildUrl(path) } : sampleImage);

export default function PurchaseAndSaleMonitoring({ onNavigate }) {
  const { tick, refreshControl } = useRefresh();
  const [selectedType, setSelectedType] = useState('Purchases');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);

  // One call monitors both purchases and sales across every technician.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await postJson(ENDPOINTS.ADMIN_TRADE_MONITORING, {});
        if (active && response.ok && data && data.success !== false && data.data) {
          const pRows = Array.isArray(data.data.purchases) ? data.data.purchases : [];
          const sRows = Array.isArray(data.data.sales) ? data.data.sales : [];
          setPurchases(pRows.map(r => ({
            id: `p${r.id}`,
            device: deviceName(r.device_brand, r.device_model),
            storage: r.storage || '',
            color: r.color || '',
            imei: r.imei1 ? `IMEI ${r.imei1}` : 'IMEI —',
            image: photoSource(r.device_photo_path),
            technician: r.technician_name || '—',
            shop: r.shop_name || '—',
            seller: r.seller_name || '—',
            purchasePrice: money(r.purchase_price),
            type: 'purchase',
          })));
          setSales(sRows.map(r => ({
            id: `s${r.id}`,
            device: deviceName(r.device_brand, r.device_model),
            storage: r.storage || '',
            color: r.color || '',
            imei: r.imei1 ? `IMEI ${r.imei1}` : 'IMEI —',
            image: photoSource(r.device_photo_path),
            technician: r.technician_name || '—',
            shop: r.shop_name || '—',
            buyer: r.buyer_name || '—',
            salePrice: money(r.sale_price),
            purchasePrice: money(r.purchase_price),
            type: 'sale',
          })));
        }
      } catch (e) {
        // leave lists empty on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('goBack');
    }
  };

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleViewAdminReports = () => {
    if (onNavigate) {
      onNavigate('adminReports');
    }
  };

  const currentTransactions = selectedType === 'Purchases' ? purchases : sales;

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        selectedTransaction?.id === item.id && styles.transactionItemActive,
      ]}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={styles.deviceImageContainer}>
        <Image
          source={item.image}
          style={styles.deviceImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.deviceName}>{item.device}</Text>
        <Text style={styles.deviceSpec}>{item.storage} · {item.color}</Text>
        <Text style={styles.imei}>{item.imei}</Text>
        <Text style={styles.techLine}>
          {item.technician} · {item.shop}
        </Text>
        <Text style={styles.amountLine}>
          {item.type === 'sale' ? `Sold ${item.salePrice}` : `Bought ${item.purchasePrice}`}
        </Text>
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
          <Text style={styles.headerTitle}>Trade Monitoring</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Device transactions</Text>
            <Text style={styles.subtitle}>
              Review verified purchases and sales.
            </Text>
          </View>

          {/* Type Filter */}
          <View style={styles.typeFilterSection}>
            <Text style={styles.typeLabel}>Type</Text>
            <View style={styles.typeButtons}>
              {['Purchases', 'Sales'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setSelectedTransaction(null);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsListContainer}>
            <FlatList
              data={currentTransactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTransactionItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                </View>
              }
            />
          </View>

          {/* Transaction Details Section */}
          {selectedTransaction && (
            <View style={styles.transactionDetailsSection}>
              <Text style={styles.detailsTitle}>
                {selectedTransaction.type === 'sale' ? 'Sale' : 'Purchase'}
              </Text>

              {/* Which technician / shop made this transaction */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Technician</Text>
                <Text style={styles.detailValue}>{selectedTransaction.technician}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shop</Text>
                <Text style={styles.detailValue}>{selectedTransaction.shop}</Text>
              </View>

              {selectedTransaction.type === 'sale' ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Buyer</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.buyer}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sale price</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.salePrice}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cost price</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.purchasePrice}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Seller</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.seller}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Purchase price</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.purchasePrice}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* View Admin Reports Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewReportsButton}
            onPress={handleViewAdminReports}
          >
            <Text style={styles.viewReportsButtonText}>View admin reports</Text>
          </TouchableOpacity>
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
    // color: Colors.primary,
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
  titleSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  mainTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#6B7280',
  },
  typeFilterSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  typeLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: hp('1%'),
  },
  typeButtons: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  typeButton: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('4%'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: '#5B8DEE',
  },
  typeButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  transactionsListContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  transactionItemActive: {
    borderColor: Colors.secondary,
    borderWidth: 2,
    backgroundColor: '#F0F4FF',
  },
  deviceImageContainer: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('3%'),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  deviceImage: {
    width: wp('18%'),
    height: wp('18%'),
    // tintColor: '#5B8DEE',
  },
  transactionContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: hp('0.2%'),
  },
  deviceSpec: {
    fontSize: wp('3%'),
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: hp('0.2%'),
  },
  imei: {
    fontSize: wp('2.8%'),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  techLine: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: '#5B8DEE',
    marginTop: hp('0.5%'),
  },
  amountLine: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#1F2937',
    marginTop: hp('0.2%'),
  },
  transactionDetailsSection: {
    marginHorizontal: wp('4%'),
    marginVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
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
  viewReportsButton: {
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
  viewReportsButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
