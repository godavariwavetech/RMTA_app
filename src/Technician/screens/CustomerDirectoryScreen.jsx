import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from '../../redux/slices/authSlice';
import { SkeletonUserList } from '../../Components/Skeleton';

// Customer directory with three tabs, each with its own call (all POST
// { member_id }): Jobs -> /public_app/getjobsdata, Sales ->
// /public_app/getsalescustomersdata, Purchases -> /public_app/getpurchasedata.
// Each tab lists the customers on that kind of record, merged by mobile
// number, with how many records each one has.
const TABS = [
  { key: 'jobs', label: 'Jobs', noun: 'job', match: /job/i },
  { key: 'sales', label: 'Sales', noun: 'sale', match: /sale/i },
  { key: 'purchases', label: 'Purchases', noun: 'purchase', match: /purchase/i },
];

const first = (row, keys) => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).length < 200) {
      return String(v).trim();
    }
  }
  return '';
};

const nameOf = r => first(r, ['customer_name', 'buyer_name', 'seller_name', 'name']);
const mobileOf = r =>
  first(r, ['customer_mobile', 'mobile_number', 'customer_mobile_number', 'customer_number', 'buyer_mobile', 'seller_mobile', 'mobile', 'phone_number'])
    .replace(/\D/g, '')
    .slice(-10);

// Splits the response into { jobs, sales, purchases }. Accepts an object whose
// keys name the lists (jobs / job_sheets, sales / sales_sheets, purchases ...)
// or a flat array of rows that carry a `type` field.
function toBuckets(payload) {
  const out = { jobs: [], sales: [], purchases: [] };
  if (Array.isArray(payload)) {
    payload.forEach(row => {
      const t = String((row && (row.type || row.record_type || row.source)) || '');
      const tab = TABS.find(x => x.match.test(t));
      if (tab) out[tab.key].push(row);
    });
    return out;
  }
  Object.entries(payload || {}).forEach(([key, value]) => {
    const tab = TABS.find(x => x.match.test(key));
    if (tab && Array.isArray(value)) out[tab.key] = value;
  });
  return out;
}

export default function CustomerDirectoryScreen({ onNavigate }) {
  const user = useSelector(state => state.auth?.user) || {};
  const [buckets, setBuckets] = useState({ jobs: [], sales: [], purchases: [] });
  const [tab, setTab] = useState('jobs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user.member_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const call = async endpoint => {
      try {
        const { response, data } = await postJson(endpoint, { member_id: user.member_id });
        if (!response.ok || !data || data.success === false) {
          return { error: (data && (data.message || data.msg)) || 'Could not load customers. Pull down to retry.' };
        }
        return { payload: data.data !== undefined ? data.data : data };
      } catch (e) {
        return { error: 'Could not load customers. Pull down to retry.' };
      }
    };
    const [jobsData, salesData, purchaseData] = await Promise.all([
      call(ENDPOINTS.GET_JOBS_DATA),
      call(ENDPOINTS.GET_SALES_CUSTOMERS_DATA),
      call(ENDPOINTS.GET_PURCHASE_DATA),
    ]);
    const next = { jobs: [], sales: [], purchases: [] };
    // Each endpoint is single-purpose (jobs / sales / purchases only), so a
    // plain array response belongs entirely to that tab — it doesn't carry a
    // per-row `type` field. Only fall back to toBuckets (type-tagged rows, or
    // an object keyed by list name) when the response isn't a plain array.
    const rowsFrom = (result, tabKey) => {
      if (!result.payload) return null;
      return Array.isArray(result.payload) ? result.payload : toBuckets(result.payload)[tabKey];
    };
    next.jobs = rowsFrom(jobsData, 'jobs') || next.jobs;
    next.sales = rowsFrom(salesData, 'sales') || next.sales;
    next.purchases = rowsFrom(purchaseData, 'purchases') || next.purchases;
    setBuckets(next);
    if (jobsData.error && salesData.error && purchaseData.error) setError(jobsData.error);
    setLoading(false);
  }, [user.member_id]);

  useEffect(() => {
    load();
  }, [load]);

  // Customers per tab: rows merged by mobile number (or name when there is none).
  const byTab = useMemo(() => {
    const result = {};
    TABS.forEach(t => {
      const byKey = {};
      (buckets[t.key] || []).forEach(row => {
        const mobile = mobileOf(row);
        const name = nameOf(row);
        if (!mobile && !name) return;
        const id = mobile || name.toLowerCase();
        const c = byKey[id] || { id, name, mobile, count: 0 };
        if (!c.name) c.name = name;
        if (!c.mobile) c.mobile = mobile;
        c.count += 1;
        byKey[id] = c;
      });
      result[t.key] = Object.values(byKey).sort((a, b) => (a.name || '~').localeCompare(b.name || '~'));
    });
    return result;
  }, [buckets]);

  const active = TABS.find(t => t.key === tab);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byTab[tab].filter(c => !q || `${c.name} ${c.mobile}`.toLowerCase().includes(q));
  }, [byTab, tab, query]);

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('goBack')} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Customer directory</Text>
          <Text style={styles.count}>{byTab[tab].length}</Text>
        </View>
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label} ({byTab[t.key].length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or mobile"
            placeholderTextColor="#94A3B8"
          />
        </View>
        {loading && !byTab[tab].length ? (
          <SkeletonUserList />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={c => c.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={load}
            ListEmptyComponent={
              <Text style={styles.empty}>{error || `No ${active.label.toLowerCase()} customers yet.`}</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name || '#').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name || 'Unnamed customer'}
                  </Text>
                  {!!item.mobile && <Text style={styles.mobile}>{item.mobile}</Text>}
                  <View style={styles.tags}>
                    <Text style={styles.tag}>
                      {item.count} {active.noun}
                      {item.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
                {!!item.mobile && (
                  <TouchableOpacity style={styles.call} onPress={() => Linking.openURL(`tel:${item.mobile}`)}>
                    <Text style={styles.callText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, includeFontPadding: false },
  title: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginLeft: 6 },
  count: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF3',
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.secondary },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: Colors.secondary, fontWeight: '800' },
  searchWrap: { paddingHorizontal: 14, paddingTop: 12 },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  list: { padding: 14, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#C2410C' },
  rowText: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  mobile: { fontSize: 12, color: '#64748B', marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 5,
    overflow: 'hidden',
  },
  call: { backgroundColor: '#DCFCE7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 },
  callText: { color: '#15803D', fontWeight: '800', fontSize: 12 },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 13 },
});
