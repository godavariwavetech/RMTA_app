import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
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
import { SkeletonUserList } from '../../Components/Skeleton';
import { fetchSupporters } from '../../redux/slices/supportersSlice';
import { BASE_URL } from '../../Constants/config';

// `location` arrives as a JSON string: {"points":[{"lat":..,"lng":..}]}.
const parseLocation = raw => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const point = parsed && parsed.points && parsed.points[0];
    if (point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))) {
      return { lat: Number(point.lat), lng: Number(point.lng) };
    }
  } catch (e) {
    // no usable location
  }
  return null;
};

const imageUrl = path =>
  path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${String(path).replace(/^\//, '')}`) : null;

export default function SupportUsersScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.supporters);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchSupporters());
  }, [dispatch]);

  const users = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return list;
    return list.filter(user =>
      [user.name, user.phone_number, user.shop_name].some(value =>
        String(value || '').toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [list, query]);

  const openMap = point =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`);
  const callNumber = phone => Linking.openURL(`tel:${phone}`);

  const renderUser = ({ item }) => {
    const point = parseLocation(item.location);
    const photo = imageUrl(item.shop_image);

    return (
      <View style={styles.userCard}>
        <View style={styles.userTopRow}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.shopImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.name || 'U').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userHeading}>
            <Text style={styles.userName}>{item.name || 'Unnamed supporter'}</Text>
            <Text style={styles.memberCode}>{item.shop_name || 'Shop not added'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {!!item.phone_number && (
            <TouchableOpacity style={styles.actionButton} onPress={() => callNumber(item.phone_number)}>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
          {!!point && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => openMap(point)}
            >
              <Text style={[styles.actionText, styles.actionSecondaryText]}>View on map</Text>
            </TouchableOpacity>
          )}
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
            placeholder="Search name, mobile or shop"
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
          // Only show the pull-to-refresh spinner when there's already a list;
          // the first load uses the skeleton instead.
          refreshing={loading && users.length > 0}
          onRefresh={() => dispatch(fetchSupporters())}
          ListEmptyComponent={
            loading ? (
              <SkeletonUserList count={5} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {error || (query ? 'No users match your search.' : 'No users found.')}
                </Text>
                {!!error && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => dispatch(fetchSupporters())}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </SafeAreaView>
    </>
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
  shopImage: { width: 52, height: 52, borderRadius: 12, marginRight: 11, backgroundColor: '#E8F0FE' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2F5DDC',
  },
  actionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  actionSecondary: { backgroundColor: '#EEF3FF' },
  actionSecondaryText: { color: '#2F5DDC' },
  emptyState: { flex: 1, minHeight: 160, justifyContent: 'center', alignItems: 'center' },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2F5DDC',
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: { color: '#788397', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});
