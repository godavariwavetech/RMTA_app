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
} from '../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../Constants/Colors';
import { useI18n } from '../../i18n';
import BottomNav from '../../Components/BottomNav';
import ScrollTicker from '../../Components/ScrollTicker';
import BannerCarousel from '../../Components/BannerCarousel';
import useAccountProfile from '../../utils/useAccountProfile';
import { fetchJobCounts } from '../../redux/slices/jobSheetSlice';
import { getJson } from '../../redux/slices/authSlice';
import { ENDPOINTS, BASE_URL } from '../../Constants/config';
// Re-enable together with the NFC option in the QR tile below.
// import { showAppActionSheet } from '../../utils/appModal';

// Banners survive leaving and reopening the screen: the last fetched list is
// kept here so the carousel renders it immediately instead of flashing the
// built-in banners (or nothing) until the request finishes again.
let bannerCache = null;

export default function TechnicianHomeScreen({ onNavigate }) {
  const { t } = useI18n();
  const [selectedNavItem, setSelectedNavItem] = useState('home');

  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  // Full profile (admin_details for admins, technician_details for technicians).
  const profile = useAccountProfile();

  // Today's summary counts (jobs/sales/purchases for this member today).
  const counts = useSelector(state => state.jobSheet.counts);

  useEffect(() => {
    if (user && user.member_id) {
      dispatch(fetchJobCounts({ member_id: user.member_id }));
    }
  }, [dispatch, user]);

  // Home banners from GET /public_app/getbanners. Each row's picture URL may be
  // absolute or relative to the server; rows flagged deleted (d_in) are skipped.
  // While loading, or if the call fails or returns nothing, the built-in
  // banners below are shown instead.
  const [apiBanners, setApiBanners] = useState(bannerCache || []);
  const [bannersLoaded, setBannersLoaded] = useState(bannerCache !== null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await getJson(ENDPOINTS.GET_BANNERS, undefined, 10000);
        const rows = Array.isArray(data) ? data : data && (data.data || data.banners);
        if (!active) return;
        if (!response.ok || !Array.isArray(rows)) {
          setBannersLoaded(true);
          return;
        }
        const imageOf = row =>
          row.image || row.image_url || row.banner || row.banner_url || row.banner_image ||
          row.photo || row.file || row.path || row.url || '';
        const next = rows
            .filter(row => row && !Number(row.d_in) && String(imageOf(row)).trim())
            .map((row, i) => {
              const v = String(imageOf(row)).trim();
              const uri = /^https?:\/\//.test(v) ? v : `${BASE_URL}${v.replace(/^\//, '')}`;
              return { id: `api-${row.id ?? i}`, image: { uri, cache: 'force-cache' } };
            });
        // Only replace what's on screen when the list really changed.
        const same =
          bannerCache &&
          bannerCache.length === next.length &&
          bannerCache.every((b, i) => b.id === next[i].id && b.image.uri === next[i].image.uri);
        bannerCache = next;
        // Warm the image cache so reopening Home shows the pictures at once.
        next.forEach(b => Image.prefetch(b.image.uri).catch(() => {}));
        if (!same) setApiBanners(next);
        setBannersLoaded(true);
      } catch (e) {
        // keep the built-in banners
        if (active) setBannersLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
  const handleNavigation = (screen, params) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen, params);
    }
  };

  // Home banners: picture banners and text banners that open a screen.
  const banners = [
    {
      id: 1,
      title: t('banner1Title'),
      subtitle: t('banner1Sub'),
      color: '#071A3D',
      accent: '#21D4FD',
      symbol: '⚙',
      onPress: () => handleNavigation('createJobSheetStep1', { fresh: true }),
    },
    {
      id: 2,
      title: t('banner2Title'),
      subtitle: t('banner2Sub'),
      color: '#173B82',
      accent: '#8BB8FF',
      symbol: '✓',
      onPress: () => handleNavigation('deviceVerification'),
    },
    {
      id: 3,
      title: t('banner3Title'),
      subtitle: t('banner3Sub'),
      color: '#3730A3',
      accent: '#C4B5FD',
      symbol: 'ID',
      onPress: () => handleNavigation('myDigitalId'),
    },
    {
      id: 4,
      title: t('banner4Title'),
      subtitle: t('banner4Sub'),
      color: '#126B58',
      accent: '#6EE7B7',
      symbol: '▤',
      onPress: () => handleNavigation('createJobSheetStep1', { fresh: true }),
    },
  ];

  // Pastel tile behind each quick-action icon, by action id.
  const ACTION_TINTS = {7: '#FEF3C7', 1: '#DBEAFE', 2: '#D1FAE5', 3: '#FFEDD5', 4: '#E0E7FF', 5: '#DBEAFE', 6: '#EDE9FE', 8: '#FEE2E2', 9: '#CFFAFE', 10: '#DCFCE7', 11: '#FEF3C7'};
  const quickActions = [
    { id: 7, icon: require('../../Assets/icons/qa_notes.png'), label: t('qaNotes') },
    { id: 1, icon: require('../../Assets/icons/qa_job.png'), label: t('qaNewJobSheet') },
    { id: 2, icon: require('../../Assets/icons/qa_purchase.png'), label: t('qaPurchase') },
    { id: 3, icon: require('../../Assets/icons/qa_sale.png'), label: t('qaSale') },
    { id: 4, icon: require('../../Assets/icons/qa_ceir.png'), label: t('qaCeirImei') },
    { id: 5, icon: require('../../Assets/icons/qa_id.png'), label: t('qaDigitalId') },
    { id: 6, icon: require('../../Assets/icons/qa_qr.png'), label: t('qaNfcQr') },
    { id: 8, icon: require('../../Assets/icons/qa_reports.png'), label: t('qaReports') },
    { id: 11, emoji: '📒', label: 'Customer directory' },
    { id: 9, icon: require('../../Assets/icons/qa_supporters.png'), label: t('qaSupporters') },
    { id: 10, emoji: '💬', label: 'Chat' },
  ];

  const fmt = n => String(n || 0);
  const todayStats = [
    { id: 1, count: fmt(counts.jobs_today), label: t('jobsToday'), icon: require('../../Assets/icons/clipboard.png'), color: '#DBEAFE', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 2, count: fmt(counts.completed), label: t('completed'), icon: require('../../Assets/icons/circle-check.png'), color: '#DCFCE7', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 3, count: fmt(counts.pending), label: t('pending'), icon: require('../../Assets/icons/pending.png'), color: '#f8f5daff', textColor: '#333333ff', borderColor: 'transparent' },
    { id: 4, count: fmt(counts.sales), label: t('sales'), icon: require('../../Assets/icons/arrow-up-right.png'), color: '#FFF7ED', textColor: '#333333ff', borderColor: '#e5d4b8a1' },
    { id: 5, count: fmt(counts.purchases), label: t('purchases'), icon: require('../../Assets/icons/arrow-down-left.png'), color: '#EDE9FE', textColor: '#333333ff', borderColor: '#d5ccef9a' },
  ];

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
              <Image source={require('../../Assets/images/appLogo.png')} style={styles.avatarImage} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{t('welcomeBackComma')}</Text>
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

          <ScrollTicker fallbackText={t('tickerText')} />
        </View>

        {/* Featured banners */}
        {bannersLoaded || apiBanners.length ? (
          <BannerCarousel slides={apiBanners.length ? apiBanners : banners} />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.sectionUnderline} />
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  // Full rows stay evenly spread (4 per row); a partial last row
                  // fills from the left with the same column gaps.
                  (index + 1) % 4 !== 0 && styles.actionButtonGap,
                ]}
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
                    // NFC scanning is switched off for now: this tile goes straight
                    // to the QR scanner instead of asking NFC card vs QR code.
                    // showAppActionSheet(t('chooseScanType'), t('selectScanWay'), [
                    //   {
                    //     text: t('nfcCard'),
                    //     subtitle: t('readRmtaCard'),
                    //     icon: '◉',
                    //     onPress: () => handleNavigation('scanNFC'),
                    //   },
                    //   {
                    //     text: t('scanQrCode'),
                    //     subtitle: t('qrSub'),
                    //     icon: '▦',
                    //     onPress: () => handleNavigation('scanQR'),
                    //   },
                    // ]);
                    handleNavigation('scanQR');
                  } else if (action.id === 7) {
                    handleNavigation('notes');
                  } else if (action.id === 8) {
                    handleNavigation('reports');
                  } else if (action.id === 9) {
                    handleNavigation('supportUsers');
                  } else if (action.id === 10) {
                    handleNavigation('chat');
                  } else if (action.id === 11) {
                    handleNavigation('customerDirectory');
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: ACTION_TINTS[action.id] || '#EEF2FF' }]}>
                  {action.icon ? (
                    <Image source={action.icon} style={styles.actionIconImage} />
                  ) : (
                    <Text style={styles.actionEmoji}>{action.emoji}</Text>
                  )}
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('todaysSummary')}</Text>
          </View>
          <View style={styles.statsGrid}>
            {todayStats.slice(0, 3).map((stat) => (
              <TouchableOpacity
                key={stat.id}
                activeOpacity={0.8}
                style={styles.statCard}
                onPress={() => handleNavigation('jobs')}
              >
                <View style={[styles.statIconCircle, { backgroundColor: stat.color }]}>
                  <Image source={stat.icon} style={styles.statIcon} />
                </View>
                <Text style={styles.statCount}>{stat.count}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.statsGridBottom}>
            {todayStats.slice(3).map((stat) => (
              <TouchableOpacity
                key={stat.id}
                activeOpacity={0.8}
                onPress={() =>
                  handleNavigation('purchaseAndSaleHistory', {
                    initialTab: stat.id === 4 ? 'sales' : 'purchases',
                    singleTab: true,
                  })
                }
                style={styles.statCardWide}
              >
                <View style={[styles.statIconCircle, { backgroundColor: stat.color, marginBottom: 0 }]}>
                  <Image source={stat.icon} style={styles.statIcon} />
                </View>
                <View style={styles.statWideContent}>
                  <Text style={styles.statCountWide}>{stat.count}</Text>
                  <Text style={styles.statLabelWide}>{stat.label}</Text>
                </View>
                <Text style={styles.statChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

         <Text style={styles.bottomNavTitle}>{t('oneAssociation')}</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation - Sticky */}
      <BottomNav selectedItem={selectedNavItem} onNavigate={handleNavigation} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bannerPlaceholder: {
    height: 178,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    borderWidth: 1.3,
    borderColor: '#ffff'
  },
  avatarImage: {
    width: wp('8%'),
    height: wp('8%'),
    resizeMode: 'contain',
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
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  actionButtonGap: {
    marginRight: '2.5%',
  },
  sectionUnderline: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2F5DDC',
    marginTop: 5,
  },
  actionButton: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    paddingTop: 9,
    paddingBottom: 7,
    paddingHorizontal: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIconImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  actionEmoji: { fontSize: 30 },
  actionLabel: {
    fontSize: 10,
    lineHeight: 13,
    minHeight: 26,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  statCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  statsGridBottom: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statCardWide: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statWideContent: {
    flex: 1,
  },
  statLabelWide: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statCountWide: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statChevron: {
    fontSize: 22,
    color: '#9CA3AF',
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
