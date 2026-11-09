import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../utils/responsive';

import { Colors } from '../../../Constants/Colors';
import { getPhotos } from '../../../utils/photoCache';

// Preferred display order / labels; any other field the API returns is
// appended afterwards with a prettified label.
const LABELS = {
  id: 'ID',
  invoice_no: 'Invoice no',
  invoice_id: 'Invoice ID',
  purchase_code: 'Purchase code',
  sale_code: 'Sale code',
  device_brand: 'Brand',
  device_model: 'Model',
  storage: 'Storage',
  color: 'Color',
  imei1: 'IMEI 1',
  imei2: 'IMEI 2',
  seller_name: 'Seller',
  seller_mobile: 'Seller mobile',
  buyer_name: 'Buyer',
  buyer_mobile: 'Buyer mobile',
  purchase_price: 'Purchase price',
  purchaseprice: 'Purchase price',
  sale_price: 'Sale price',
  paymentmode: 'Purchase payment mode',
  payment_mode: 'Payment mode',
  transactionid: 'Transaction ID',
  warranty_notes: 'Warranty notes',
  purchase_date: 'Purchased on',
  created_date: 'Created on',
  sale_date: 'Sold on',
  devicestatus: 'Device status',
  chargingport: 'Charging port',
  customer_name: 'Name',
  mobile_number: 'Mobile',
  aadharnumber: 'Aadhaar number',
  address: 'Address',
  status: 'Status',
  created_at: 'Created',
  sold_at: 'Sold on',
  updated_at: 'Updated',
};
const HIDDEN = [
  'member_id', 'customer_id', 'user_id', 'seller_id', 'buyer_id',
  'purchase_id', 'verify_otp', 'd_in', 'available',
  // Shown as actual photo previews above (see `photos`), not as raw URL text.
  'frontimage', 'backimage', 'baackimage', 'billimage', 'device_image',
  'condition_images',
];
const MONEY = ['purchase_price', 'purchaseprice', 'sale_price', 'price', 'amount'];

const prettify = key =>
  LABELS[key] ||
  key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

const formatValue = (key, v) => {
  if (/_at$|_date$/.test(key)) {
    const d = new Date(v);
    if (!isNaN(d)) {
      const hasTime = String(v).includes('T') && !/T00:00:00(\.000)?Z?$/.test(String(v));
      return d.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      });
    }
  }
  if (MONEY.includes(key) && !isNaN(Number(v))) {
    return `₹${Number(v).toLocaleString('en-IN')}`;
  }
  if (typeof v === 'object') return JSON.stringify(v);
  const str = String(v);
  return key === 'status' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
};

// Sections shown on the details screen, in order. A field goes to the first
// section whose pattern matches its key; anything left over lands in "Other".
const SECTIONS = [
  { title: 'Device', test: /brand|model|storage|ram|color|imei|serial|device/ },
  { title: 'Condition', test: /screen|body|battery|camera|speaker|chargingport|working|condition|accessor|box|charger/ },
  { title: 'Seller', buyerTitle: 'Buyer', test: /seller|buyer|customer|aadhar|aadhaar|address|mobile|phone/ },
  { title: 'Payment', test: /price|amount|payment|paid|invoice|total|discount|mode|transaction|warranty/ },
  { title: 'Status & dates', test: /status|_at$|date|code|^id$/ },
];

// Detail view for one purchase or sale row from the history list. Shows every
// field the API returned for that row.
export default function TransactionDetails({ onNavigate, type = 'purchases', item }) {
  const isPurchase = type === 'purchases';
  const raw = (item && item.raw) || {};

  useEffect(() => {
    console.log(
      `[${type}] details row:`,
      JSON.stringify(item && item.raw, (k, v) =>
        typeof v === 'string' && v.length > 80 ? `${v.slice(0, 80)}...(${v.length})` : v,
      ),
    );
  }, [type, item]);

  const handleBackPress = () => {
    if (onNavigate) onNavigate('goBack');
  };

  const entries = Object.keys(raw)
    .filter(
      k =>
        !HIDDEN.includes(k) &&
        !/(front|back|damage|bill|device)_?(image|photo|picture)$/i.test(k) &&
        raw[k] !== null &&
        raw[k] !== '' &&
        raw[k] !== undefined &&
        !(typeof raw[k] === 'string' && raw[k].length > 300),
    )
    .sort((a, b) => {
      const ia = Object.keys(LABELS).indexOf(a);
      const ib = Object.keys(LABELS).indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  const photos = getPhotos(`${type}-${item && item.id}`);
  const rows = entries;

  const sections = SECTIONS.map(sec => ({
    title: isPurchase ? sec.title : sec.buyerTitle || sec.title,
    keys: [],
    test: sec.test,
  }));
  rows.forEach(k => {
    const sec = sections.find(x => x.test.test(k));
    if (sec) sec.keys.push(k);
  });
  const visibleSections = sections.filter(x => x.keys.length > 0);
  const otherRows = [];
  const appendOtherValue = (key, value, label = prettify(key)) => {
    if (
      HIDDEN.includes(key) ||
      /(front|back|damage|bill|device)_?(image|photo|picture)$/i.test(key)
    ) {
      return;
    }
    if (value !== null && typeof value === 'object') {
      const nestedEntries = Array.isArray(value)
        ? value.map((child, index) => [`Item ${index + 1}`, child])
        : Object.entries(value);
      if (nestedEntries.length === 0) {
        otherRows.push([label, 'NA']);
        return;
      }
      nestedEntries.forEach(([childKey, childValue]) => {
        appendOtherValue(childKey, childValue, `${label} · ${prettify(childKey)}`);
      });
      return;
    }
    const formattedValue =
      value === null || value === undefined || value === ''
        ? 'NA'
        : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : formatValue(key, value);
    otherRows.push([label, formattedValue]);
  };
  Object.keys(raw).forEach(key => {
    if (HIDDEN.includes(key) || SECTIONS.some(section => section.test.test(key))) return;
    appendOtherValue(key, raw[key]);
  });
  if (otherRows.length === 0) otherRows.push(['Other details', 'NA']);

  const statusText = item?.status || formatValue('status', raw.status || '');
  const amountText = item?.amount || '';

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={true} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isPurchase ? 'Purchase details' : 'Sale details'}</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {item ? (
            <View style={styles.content}>
              {/* Summary */}
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={styles.heroText}>
                    <Text style={styles.title} numberOfLines={2}>{item.deviceName}</Text>
                    {item.imei ? <Text style={styles.heroSub}>IMEI {item.imei}</Text> : null}
                  </View>
                  {statusText ? (
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{statusText}</Text>
                    </View>
                  ) : null}
                </View>
                {amountText ? (
                  <View style={styles.heroAmountRow}>
                    <Text style={styles.heroAmountLabel}>{isPurchase ? 'Purchase price' : 'Sale price'}</Text>
                    <Text style={styles.heroAmount}>{amountText}</Text>
                  </View>
                ) : null}
              </View>

              {photos.map(photo => (
                <View key={photo.label} style={styles.section}>
                  <Text style={styles.sectionTitle}>{photo.label}</Text>
                  <View style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={styles.deviceImage} />
                  </View>
                </View>
              ))}

              {visibleSections.map(sec => (
                <View key={sec.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                  <View style={styles.card}>
                    {sec.keys.map((k, i) => (
                      <View key={k} style={[styles.row, i === sec.keys.length - 1 && styles.lastRow]}>
                        <Text style={styles.label}>{prettify(k)}</Text>
                        <Text style={styles.value}>{formatValue(k, raw[k])}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Other details</Text>
                <View style={styles.card}>
                  {otherRows.map(([label, value], index) => (
                    <View
                      key={`${label}-${index}`}
                      style={[styles.row, index === otherRows.length - 1 && styles.lastRow]}
                    >
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.value}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>No details available</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e9e9ff',
    borderRadius: wp('4%'),
  },
  backButtonText: { fontSize: wp('10%'), color: Colors.primary, fontWeight: '300', includeFontPadding: false, textAlign: 'center', textAlignVertical: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'center' },
  placeholderButton: { width: 44 },
  content: { paddingHorizontal: wp('5%'), paddingVertical: hp('2%') },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: wp('5%'),
    marginBottom: hp('2.5%'),
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroText: { flex: 1, marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  heroAmountRow: {
    marginTop: hp('2%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  heroAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroAmount: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  section: { marginBottom: hp('2.5%') },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  deviceImage: {
    width: '100%',
    height: hp('22%'),
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: wp('4%'),
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1.4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastRow: { borderBottomWidth: 0 },
  label: { fontSize: 14, color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '600', color: '#1F2937', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  empty: { textAlign: 'center', marginTop: hp('10%'), color: '#9CA3AF' },
});
