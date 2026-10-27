import React, { useState, useEffect } from 'react';
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
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import BottomNav from '../../Components/BottomNav';
import { postJson } from '../../redux/slices/authSlice';
import { fetchJobCounts } from '../../redux/slices/jobSheetSlice';
import { ENDPOINTS } from '../../Constants/config';
import { showAppActionSheet } from '../../utils/appModal';

export default function TechnicianHomeScreen({ onNavigate }) {
  const [selectedNavItem, setSelectedNavItem] = useState('home');

  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  // Full profile — admins were self-registered (member_registertion), so
  // their details live under admin_details; technicians were added by an
  // admin, so theirs live under technician_details. Both fetched by user_id.
  const isAdmin = user && user.role === 'admin';
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !user.user_id) return;
      try {
        const endpoint = isAdmin ? ENDPOINTS.ADMIN_DETAILS : ENDPOINTS.TECHNICIAN_DETAILS;
        const { response, data } = await postJson(endpoint, {
          user_id: user.user_id,
        });
        if (active && response.ok && data && data.success !== false) {
          // This backend sometimes wraps the record in a single-element
          // array ([{ ...profile }]) instead of returning it directly.
          const record = Array.isArray(data.data) ? data.data[0] : data.data;
          setProfile(record);
        }
      } catch (e) {
        // Keep the cached login details if the fetch fails.
      }
    })();
    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  // Today's summary counts (jobs/sales/purchases for this member today).
  const counts = useSelector(state => state.jobSheet.counts);

  useEffect(() => {
    if (user && user.member_id) {
      dispatch(fetchJobCounts({ member_id: user.member_id }));
    }
  }, [dispatch, user]);

  // Recent activity: latest job sheet created, IMEI verified, and phone sold.
  // Any action that never happened comes back null and is simply omitted.
  const [recent, setRecent] = useState({ job: null, imei: null, sale: null });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || !user.member_id) return;
      try {
        const { response, data } = await postJson(ENDPOINTS.RECENT_ACTIVITY, {
          member_id: user.member_id,
        });
        if (active && response.ok && data && data.success !== false) {
          setRecent(data.data || { job: null, imei: null, sale: null });
        }
      } catch (e) {
        // leave recent activity empty on failure
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // View model: start from the cached login user (always has the basics),
  // then layer the freshly fetched profile on top — but only its non-empty
  // fields, so a profile response missing e.g. full_name/shop_name can't
  // blank out data we already had (was causing a flash-then-blank glitch).
  const d = {
    ...(user || {}),
    ...Object.fromEntries(
      Object.entries(profile || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    ),
  };
  const techName = d.full_name || 'Technician';
  const techInitials = techName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const techShop = d.shop_name || '—';
  const techLocation = [d.city, d.state].filter(Boolean).join(', ') || '—';
  const techRmtaId = d.member_code || '—';
  const techValidUntil = d.valid_until;

  // Active/Inactive, shown on the ID card badge only (display-only — no
  // self-toggle on this screen). Admins have no technician_status — their
  // status comes from membership_status (1 = active) instead.
  const isActive = isAdmin
    ? Number(user && user.membership_status) === 1
    : (user && user.technician_status) === 'active';

  const handleNavigation = (screen, params) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen, params);
    }
  };

  const banners = [
    { id: 1, image: require('../../Assets/images/TechnicianHomeBanner1.png') },
  ];

  const quickActions = [
    { id: 1, icon: require('../../Assets/icons/quickActions1.png'), label: 'New job sheet' },
    { id: 2, icon: require('../../Assets/icons/quickActions2.png'), label: 'Purchase' },
    { id: 3, icon: require('../../Assets/icons/quickActions3.png'), label: 'Sale' },
    { id: 4, icon: require('../../Assets/icons/quickActions4.png'), label: 'CEIR / IMEI' },
    { id: 5, icon: require('../../Assets/icons/quickActions5.png'), label: 'Digital ID' },
    { id: 6, icon: require('../../Assets/icons/quickActions6.png'), label: 'NFC / QR scan' },
    { id: 8, icon: require('../../Assets/icons/quickActions8.png'), label: 'Reports' },
    { id: 9, icon: require('../../Assets/icons/helpIcon.png'), label: 'Support' },
  ];

  // Format a count as a 2-digit string (e.g. 3 → "03").
  const fmt = n => String(n || 0).padStart(2, '0');
  const todayStats = [
    { id: 1, count: fmt(counts.jobs_today), label: 'Jobs today', icon: require('../../Assets/icons/clipboard.png'), color: '#DBEAFE', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 2, count: fmt(counts.completed), label: 'Completed', icon: require('../../Assets/icons/circle-check.png'), color: '#DCFCE7', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 3, count: fmt(counts.pending), label: 'Pending', icon: require('../../Assets/icons/pending.png'), color: '#f8f5daff', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 4, count: fmt(counts.sales), label: 'Sales', icon: require('../../Assets/icons/arrow-up-right.png'), color: '#FFF7ED', textColor: '#333333ff', borderColor: '#e5d4b8a1' },
    { id: 5, count: fmt(counts.purchases), label: 'Purchases', icon: require('../../Assets/icons/arrow-down-left.png'), color: '#EDE9FE', textColor: '#333333ff', borderColor: '#d5ccef9a' },
  ];

  // Build the recent-activity list from whichever actions have happened,
  // newest first. Each entry's subtitle shows the device and when it happened.
  const fmtActivityTime = v => {
    if (!v) return '';
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };
  const deviceLabel = (brand, model, fallback) =>
    [brand, model].filter(Boolean).join(' ') || fallback;

  const recentActivity = [];
  if (recent.job) {
    recentActivity.push({
      id: 'job',
      icon: require('../../Assets/icons/quickActions2.png'),
      title: 'Job sheet created',
      subtitle: `${deviceLabel(recent.job.device_brand, recent.job.device_model, 'Device')} · ${fmtActivityTime(recent.job.created_at)}`,
      time: recent.job.created_at,
      bgColor: '#DCFCE7',
    });
  }
  if (recent.imei) {
    recentActivity.push({
      id: 'imei',
      icon: require('../../Assets/icons/quickActions4.png'),
      title: 'IMEI verified',
      subtitle: `${deviceLabel(recent.imei.brand, recent.imei.model, 'Device check')} · ${fmtActivityTime(recent.imei.checked_at)}`,
      time: recent.imei.checked_at,
      bgColor: '#EDE9FE',
    });
  }
  if (recent.sale) {
    const saleTime = recent.sale.sold_at || recent.sale.created_at;
    recentActivity.push({
      id: 'sale',
      icon: require('../../Assets/icons/quickActions3.png'),
      title: 'Pre-owned phone sold',
      subtitle: `${deviceLabel(recent.sale.device_brand, recent.sale.device_model, 'Device')} · ${fmtActivityTime(saleTime)}`,
      time: saleTime,
      bgColor: '#FEF3C7',
    });
  }
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{techInitials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>Welcome back,</Text>
              <Text style={styles.name}>{techName}</Text>

            </View>
            <View style={styles.notificationIconContainer}>
              <TouchableOpacity onPress={() => onNavigate('notifications')}>
                <Image source={require('../../Assets/icons/notificationBell.png')} style={styles.notificationIcon} />
              </TouchableOpacity>
              {/* <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View> */}
            </View>
          </View>

          <View style={styles.storeCon}>
            <Image source={require('../../Assets/icons/storeIcon.png')} style={styles.storeIcon} />
            <View>
              <Text style={{color: '#fff', marginLeft: wp('0.5%')}}>{techShop}</Text>
              <View style={styles.locationCon}>
                <Image source={require('../../Assets/icons/map-pin.png')} style={styles.mapPinIcon} />
                <Text style={{color: '#B5C5DF'}}>{techLocation}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* ID Card Section */}
        <TouchableOpacity
          style={styles.idCard}
          onPress={() => handleNavigation('myDigitalId')}
        >
          <View style={styles.idCardContent}>

            <View style={styles.idCardHeader}>
              <View style={{display: 'flex', flexDirection: 'row', gap: wp('5%'), justifyContent: 'center'}}>
                <Image source={require('../../Assets/images/appLogo.png')} style={styles.appLogo} />
                <View style={{marginTop: hp('0.6%')}}>
                  <Text style={styles.idName}>RMTA</Text>
                  <Text style={styles.idDetail}>Digital Member</Text>
                </View>
              </View>

              <View style={[styles.idBadge, !isActive && styles.idBadgeInactive]}>
                {isActive && <Text style={styles.idBadgeCheckmark}>✓</Text>}
                <Text
                  style={[
                    styles.idBadgeText,
                    !isActive && styles.idBadgeTextInactive,
                  ]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

            </View>

            <View style={styles.idCardBody}>
              <View style={{marginTop: hp('0.6%')}}>
                <Text style={styles.idName}>{techName}</Text>
                <Text style={styles.idDetail}>{techRmtaId}</Text>
                {techValidUntil ? (
                  <Text style={styles.idDate}>
                    Valid until {techValidUntil}
                  </Text>
                ) : null}
              </View>

              <View style={styles.qrCode}>
                <Image source={require('../../Assets/images/qrCode.png')} style={styles.qrImage} />
              </View>

            </View>


          </View>

        </TouchableOpacity>

        {/* Featured Banner */}
        <View style={styles.bannerContainer}>
          <TouchableOpacity style={styles.banner}>
            <Image source={banners[0].image} style={styles.bannerImage} />
          </TouchableOpacity>
          <View style={styles.dotsContainer}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === 0 && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={() => {
                  if (action.id === 1) {
                    handleNavigation('createJobSheetStep1', { fresh: true });
                  } else if (action.id === 2) {
                    handleNavigation('purchaseEntryStep1');
                  } else if (action.id === 3) {
                    handleNavigation('saleEntryStep1');
                  } else if (action.id === 4) {
                    handleNavigation('deviceVerification');
                  } else if (action.id === 5) {
                    handleNavigation('myDigitalId');
                  } else if (action.id === 6) {
                    showAppActionSheet('Choose a scan type', 'Select a way to scan.', [
                      {
                        text: 'NFC card',
                        subtitle: 'Read an RMTA card',
                        icon: '◉',
                        onPress: () => handleNavigation('scanNFC'),
                      },
                      {
                        text: 'Scan QR code',
                        subtitle: 'Use a QR code image or camera',
                        icon: '▦',
                        onPress: () => handleNavigation('scanQR'),
                      },
                    ]);
                  } else if (action.id === 8) {
                    handleNavigation('reports');
                  } else if (action.id === 9) {
                    handleNavigation('supportUsers');
                  }
                }}
              >
                <View style={styles.actionIcon}>
                  <Image source={action.icon} style={styles.actionIconImage} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's summary</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all {'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            {todayStats.slice(0, 3).map((stat) => (
              <TouchableOpacity key={stat.id} style={[styles.statCard, { backgroundColor: stat.color }]}>
                <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: wp('1%')}}>
                  <Image source={stat.icon} style={styles.statIcon} />
                  <Text style={[styles.statCount, { color: stat.textColor }]}>{stat.count}</Text>
                </View>

                <Text style={[styles.statLabelWide, ]}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statsGridBottom}>
            {todayStats.slice(3).map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={[
                  styles.statCardWide,
                  {
                    backgroundColor: stat.color,
                    borderWidth: 2,
                    borderColor: stat.borderColor
                  }
                ]}
              >

                <View style={styles.statWideContent}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: wp('2%')}}>
                    <Image source={stat.icon} style={styles.statIconWide} />
                    <Text style={[styles.statLabelWide, ]}>{stat.label}</Text>
                  </View>

                  <Text style={[styles.statCountWide, { color: stat.textColor }]}>{stat.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all {'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <TouchableOpacity key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.bgColor }]}>
                    <Image source={activity.icon} style={styles.activityIconImage} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.activityEmptyText}>
                No recent activity yet. Create a job sheet, verify an IMEI, or record a sale to see it here.
              </Text>
            )}
          </View>
        </View>

         <Text style={styles.bottomNavTitle}>One association. Stronger together.</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation - Sticky */}
      <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} />
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
    backgroundColor: Colors.primary,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('10%'),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('20%'),
    backgroundColor: '#2F5DDC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    borderWidth: 1.3,
    borderColor: '#ffff'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: wp('3.6%'),
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: wp('2.8%'),
    color: '#D1D5DB',
    marginTop: hp('0.4%'),
  },
  notificationIconContainer: {
    position: 'relative',
    width: wp('13%'),
    height: wp('2%'),
    // alignSelf : 'auto',
    backgroundColor: '#193057ff',
    // padding: wp('4%')
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    borderRadius: wp('30%'),
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  storeCon: {
    width: wp('94%'),
    backgroundColor: '#193057ff',
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('2.6%'),
    marginBottom: hp('2%'),
    display: 'flex',
    flexDirection: 'row',
    gap: wp('3%'),
    alignItems: 'center'
  },

  storeIcon: {
    height: wp('6%'),
    width: wp('6%'),
  },

  locationCon: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },

  mapPinIcon: {
    height: wp('4%'),
    width: wp('4%'),
  },

  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    // position: 'relative',
    // top: hp('-10%'),
    marginHorizontal: wp('3%'),
    marginTop: hp('-10%'),
    marginBottom: hp('2%')
  },
  idCardContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // marginBottom: 12,
  },
  idCardHeader : {
    display:'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp('88%'),
  },
  idCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  appLogo : {
    height: wp('12%'),
    width: wp('12%')
  },

  idCardBody :{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp('88%'),
    paddingVertical: hp('2%'),
  },
  // idAvatar: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: '#6B7280',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginRight: 12,
  // },
  // idAvatarText: {
  //   color: '#FFFFFF',
  //   fontSize: 14,
  //   fontWeight: '600',
  // },
  idName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  idDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  idDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  qrCode: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  idBadgeCheckmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 4,
  },
  idBadgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  idBadgeTextInactive: {
    color: '#6B7280',
    marginLeft: 0,
  },
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('3%'),
    marginBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dddddd9d',
  },
  statusToggleInfo: {
    flex: 1,
    marginRight: wp('3%'),
  },
  statusToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusToggleSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    paddingVertical: hp('2%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#dddddd9d'
  },
  actionIcon: {
    width: wp('4%'),
    height: wp('12%'),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // backgroundColor: '#F3F4F6',
  },
  actionIconImage: {
    width: wp('10%'),
    height: wp('10%'),
    resizeMode: 'contain',
  },
  actionLabel: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  banner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#bbbbbbff',
    width: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  statCard: {
    width: '31%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    width: wp('5%'),
    height: wp('5%'),
    resizeMode: 'contain',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsGridBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  statCardWide: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconWide: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  statWideContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabelWide: {
    fontSize: 14,
    fontWeight: '500',
    color: '#596579'
  },

  statCountWide: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  activityList: {
    marginTop: 12,
    backgroundColor: '#ffffffff',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0%'),
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#e2e2e2ff',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2ff',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('0%'),
    // backgroundColor: '#FFFFFF',
    // borderRadius: 12,
    // marginBottom: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  activitySubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('2%'),
  },
  chevron: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 40,
  },
  bottomNavContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderTopWidth: 1,
    // borderTopColor: '#E5E7EB',
  },
  bottomNavTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  navItemCenter: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: 28,
    // backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navIconCenter: {
    width: wp('10%'),
    height: wp('10%'),
    resizeMode: 'contain',
  },
});
