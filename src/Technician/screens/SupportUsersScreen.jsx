import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Colors } from '../../Constants/Colors';
import { fetchTechnicians } from '../../redux/slices/techniciansSlice';

export default function SupportUsersScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.technicians);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchTechnicians());
  }, [dispatch]);

  const users = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return list;
    return list.filter(user =>
      [user.full_name, user.mobile, user.member_code, user.shop_name, user.city, user.state]
        .some(value => String(value || '').toLowerCase().includes(normalizedQuery)),
    );
  }, [list, query]);

  const renderUser = ({ item }) => {
    const isActive = String(item.technician_status || '').toLowerCase() === 'active';
    const location = [item.city, item.state].filter(Boolean).join(', ');

    return (
      <View style={styles.userCard}>
        <View style={styles.userTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.full_name || 'U').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userHeading}>
            <Text style={styles.userName}>{item.full_name || 'Unnamed user'}</Text>
            <Text style={styles.memberCode}>{item.member_code || 'RMTA member'}</Text>
          </View>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
              {item.technician_status || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <Detail label="Mobile" value={item.mobile} />
          <Detail label="Shop" value={item.shop_name} />
          <Detail label="Location" value={location} />
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar backgroundColor="#F5F7FB" barStyle="dark-content" translucent />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onNavigate?.('goBack')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Supporters</Text>
            <Text style={styles.subtitle}>RMTA member directory</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBox}>
          <Image
            source={require('../../Assets/icons/search.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, mobile, shop or ID"
            placeholderTextColor="#8A94A6"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        <View style={styles.listHeading}>
          <Text style={styles.listTitle}>Users</Text>
          <Text style={styles.userCount}>{users.length}</Text>
        </View>

        <FlatList
          data={users}
          keyExtractor={(item, index) => String(item.user_id || item.member_id || index)}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => dispatch(fetchTechnicians())}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.emptyText}>
                  {error || (query ? 'No users match your search.' : 'No users found.')}
                </Text>
              )}
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: {
    minHeight: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF3',
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: wp('10%'), paddingVertical: 6 },
  backText: { color: '#172033', fontSize: 34, fontWeight: '300' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: wp('10%') },
  title: { color: '#172033', fontSize: wp('5%'), fontWeight: '700' },
  subtitle: { color: '#788397', fontSize: wp('3.2%'), marginTop: 2 },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF2',
  },
  searchIcon: { width: 18, height: 18, opacity: 0.55, marginRight: 10 },
  searchInput: { flex: 1, color: '#172033', fontSize: 14, paddingVertical: 10 },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('5%'),
    marginTop: hp('2.3%'),
    marginBottom: hp('1%'),
  },
  listTitle: { flex: 1, color: '#172033', fontSize: 17, fontWeight: '700' },
  userCount: { color: '#61708A', fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: wp('4%'), paddingBottom: hp('3%'), flexGrow: 1 },
  userCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF3',
  },
  userTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
    backgroundColor: '#E8F0FE',
  },
  avatarText: { color: '#1456B8', fontSize: 18, fontWeight: '700' },
  userHeading: { flex: 1 },
  userName: { color: '#172033', fontSize: 15, fontWeight: '700' },
  memberCode: { color: '#788397', fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  activeBadge: { backgroundColor: '#DCFCE7' },
  inactiveBadge: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  activeText: { color: '#16804A' },
  inactiveText: { color: '#687386' },
  details: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF1F5' },
  detailRow: { flexDirection: 'row', paddingVertical: 4 },
  detailLabel: { width: 70, color: '#8993A4', fontSize: 12 },
  detailValue: { flex: 1, color: '#39465C', fontSize: 12, fontWeight: '500' },
  emptyState: { flex: 1, minHeight: 160, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#788397', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});
