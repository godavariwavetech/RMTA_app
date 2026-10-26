import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { ENDPOINTS } from '../../Constants/config';
import { postJson, logoutUser } from '../../redux/slices/authSlice';

// Shows the full admin profile captured at registration. Fetches fresh data
// from POST /public_app/admin_details using the logged-in admin's user_id.
export default function AdminProfileScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const admin = useSelector(state => state.auth.user) || {};

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!admin.user_id) {
        setError('Please log in again.');
        setLoading(false);
        return;
      }
      try {
        const { response, data } = await postJson(ENDPOINTS.ADMIN_DETAILS, {
          user_id: admin.user_id,
        });
        if (!active) return;
        if (!response.ok || (data && data.success === false)) {
          setError((data && data.message) || 'Could not load profile.');
        } else {
          // This backend sometimes wraps the record in a single-element
          // array ([{ ...profile }]) instead of returning it directly.
          const record = Array.isArray(data.data) ? data.data[0] : data.data;
          setDetails(record);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [admin.user_id]);

  const handleBackPress = () => {
    if (onNavigate) onNavigate('goBack');
  };

  const handleLogout = async () => {
    await dispatch(logoutUser()); // clear the persisted session
    if (onNavigate) onNavigate('intro');
  };

  // Fall back to the logged-in user object while the fetch is in flight.
  const d = details || admin;
  const name = d.full_name || 'Administrator';
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const location = [d.city, d.state].filter(Boolean).join(', ');

  const rows = [
    { label: 'Full name', value: d.full_name },
    { label: 'Mobile number', value: d.mobile },
    { label: 'RMTA ID', value: d.member_code },
    { label: 'Shop / Business', value: d.shop_name },
    { label: 'Address', value: d.address },
    { label: 'City', value: d.city },
    { label: 'State', value: d.state },
    { label: 'Membership', value: d.membership_status },
    { label: 'Role', value: d.role },
  ];

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
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Avatar + name */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>Administrator</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.secondary} />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.detailsCard}>
              {rows.map((row, idx) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    idx === rows.length - 1 && styles.detailRowLast,
                  ]}
                >
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value || '—'}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Logout */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log out</Text>
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
    fontWeight: '300',
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: hp('3%'),
  },
  avatar: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: wp('7%'),
    fontWeight: '700',
  },
  name: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#1F2937',
  },
  role: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: hp('0.3%'),
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
    gap: hp('1%'),
  },
  loadingText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  errorText: {
    fontSize: wp('3.8%'),
    color: '#DC2626',
    textAlign: 'center',
    paddingHorizontal: wp('6%'),
  },
  detailsCard: {
    marginHorizontal: wp('4%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.8%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: wp('3.3%'),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: wp('3.6%'),
    color: '#1F2937',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: wp('4%'),
    textTransform: 'capitalize',
  },
  bottomSpacer: {
    height: hp('2%'),
  },
  footer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#DC2626',
  },
});
