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

// Customer directory built from this member's own records: the customers on
// their job sheets, sales (buyers) and purchases (sellers), merged by mobile
// number. No separate customer-list API is needed.
const SOURCES = [
  { key: 'jobs', endpoint: ENDPOINTS.GET_JOB_SHEETS, label: 'Jobs' },
  { key: 'sales', endpoint: ENDPOINTS.GET_SALES_SHEETS, label: 'Sales' },
  { key: 'purchases', endpoint: ENDPOINTS.GET_PURCHASE_SHEETS, label: 'Purchases' },
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
  first(r, ['customer_mobile', 'mobile_number', 'customer_mobile_number', 'buyer_mobile', 'seller_mobile', 'mobile', 'phone_number'])
    .replace(/\D/g, '')
    .slice(-10);

export default function CustomerDirectoryScreen({ onNavigate }) {
  const user = useSelector(state => state.auth?.user) || {};
  const [customers, setCustomers] = useState([]);
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
    const results = await Promise.all(
      SOURCES.map(async s => {
        try {
          const { response, data } = await postJson(s.endpoint, { member_id: user.member_id });
          return response.ok && data && Array.isArray(data.data) ? data.data : null;
        } catch (e) {
          return null;
        }
      }),
    );
    if (results.every(r => r === null)) {
      setError('Could not load customers. Pull down to retry.');
    }
    const byKey = {};
    results.forEach((rows, i) => {
      (rows || []).forEach(row => {
        const mobile = mobileOf(row);
        const name = nameOf(row);
        if (!mobile && !name) return;
        const id = mobile || name.toLowerCase();
        const c = byKey[id] || { id, name, mobile, jobs: 0, sales: 0, purchases: 0 };
        if (!c.name) c.name = name;
        if (!c.mobile) c.mobile = mobile;
        c[SOURCES[i].key] += 1;
        byKey[id] = c;
      });
    });
    setCustomers(Object.values(byKey).sort((a, b) => (a.name || '~').localeCompare(b.name || '~')));
    setLoading(false);
  }, [user.member_id]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(c => !q || `${c.name} ${c.mobile}`.toLowerCase().includes(q));
  }, [customers, query]);

  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('goBack')} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Customer directory</Text>
          <Text style={styles.count}>{customers.length}</Text>
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
        {loading && !customers.length ? (
          <SkeletonUserList />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={c => c.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={load}
            ListEmptyComponent={<Text style={styles.empty}>{error || 'No customers yet.'}</Text>}
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
                    {SOURCES.filter(s => item[s.key] > 0).map(s => (
                      <Text key={s.key} style={styles.tag}>
                        {s.label} {item[s.key]}
                      </Text>
                    ))}
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
