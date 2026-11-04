import React, { useEffect, useState } from 'react';
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
import { useI18n, LANGUAGES } from '../../i18n';
import useAccountProfile, { useMemberProfile } from '../../utils/useAccountProfile';
import { Linking } from 'react-native';
import BottomNav from '../../Components/BottomNav';
import { getJson, logoutUser } from '../../redux/slices/authSlice';
import { BASE_URL, ENDPOINTS } from '../../Constants/config';
import { confirmAction, showAppModal } from '../../utils/appModal';

export default function TechnicianProfileScreen({ onNavigate }) {
  const { t, language } = useI18n();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [selectedNavItem, setSelectedNavItem] = useState('profile');

  // Full profile (admin_details for admins, technician_details for technicians).
  const profile = useAccountProfile();
  // A technician (staff) login belongs to a member, its admin: that member's details, found by
  // the member id, are shown in an extra card.
  const isStaff = !!user.tech_id;
  const adminProfile = useMemberProfile();

  // View model: fetched profile → cached login user → placeholders.
  const d = profile;
  const techName = d.full_name || 'Technician';
  // Anything the account has no data for stays empty and is left out of the screen.
  const techMobile = d.mobile || '';
  const techShop = d.shop_name || '';
  const techLocation = [d.city, d.state].filter(Boolean).join(', ');
  // The member code is empty for some accounts, so fall back to the member id.
  const techRmtaId = d.member_code
    ? `Member code: ${d.member_code}`
    : d.member_id
    ? `Member code: ${d.member_id}`
    : '';
  const techValidUntil = d.valid_until;
  const isAdmin = user.role === 'admin';

  // Profile photo: from the profile data when it has one, otherwise looked up in
  // getallmembers by member id. Staff logins don't have their own photo.
  const [photoUri, setPhotoUri] = useState(null);
  useEffect(() => {
    if (user.tech_id || !user.member_id) return undefined;
    let active = true;
    const toUri = v => {
      const raw = String(v || '').trim();
      if (!raw) return null;
      return /^https?:\/\//.test(raw) ? raw : `${BASE_URL}${raw.replace(/^\//, '')}`;
    };
    const own = toUri(d.person_image || d.photo || d.profile_image);
    if (own) {
      setPhotoUri(own);
      return undefined;
    }
    (async () => {
      try {
        const { response, data } = await getJson(ENDPOINTS.GET_ALL_MEMBERS);
        const rows = Array.isArray(data) ? data : data && data.data;
        if (!active || !response.ok || !Array.isArray(rows)) return;
        const row = rows.find(r => r && String(r.id) === String(user.member_id));
        if (row) setPhotoUri(toUri(row.person_image));
      } catch (e) {
        // no photo: the initial is shown instead
      }
    })();
    return () => {
      active = false;
    };
  }, [user.tech_id, user.member_id, d.person_image, d.photo, d.profile_image]);

  const handleNavigation = (screen) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleLogout = () => {
    confirmAction({
      title: 'Log out?',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
      onConfirm: async () => {
        await dispatch(logoutUser()); // clear the persisted session
        if (onNavigate) {
          onNavigate('logout');
        }
      },
    });
  };

  // Account deletion (App Store requirement). Placeholder for now: confirms,
  // shows a dummy result, then signs out and returns to the login screen.
  const handleDeleteAccount = () => {
    confirmAction({
      title: 'Delete account?',
      message: 'This will permanently delete your account and its data. This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () =>
        showAppModal(
          'Account deleted',
          'Your account has been deleted. You will now be signed out.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await dispatch(logoutUser());
                if (onNavigate) onNavigate('logout');
              },
            },
          ],
          { type: 'success' },
        ),
    });
  };

  const profileMenuItems = [
    {
      id: 1,
      icon: require('../../Assets/icons/idCard.png'),
      title: t('myDigitalId'),
      subtitle: t('myDigitalIdSub'),
    },
    {
      id: 2,
      icon: require('../../Assets/icons/settings.png'),
      title: t('settings'),
      subtitle: t('settingsSub'),
    },
    {
      id: 3,
      icon: require('../../Assets/icons/wallet.png'),
      title: t('purchaseSaleHistory'),
      subtitle: t('purchaseSaleHistorySub'),
    },
    {
      id: 4,
      icon: require('../../Assets/icons/languageIcon.png'),
      title: t('language'),
      subtitle: LANGUAGES.find(l => l.code === language)?.native,
    },
    {
      id: 5,
      icon: require('../../Assets/icons/helpIcon.png'),
      title: t('helpSupport'),
      subtitle: t('rmtaOffice'),
    },
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
          {/* Header Title */}
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{t('profile')}</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCardContainer}>
            <View style={styles.profileCard}>
              <View style={styles.profileCardTop}>

                <View style={{display: 'flex', flexDirection: 'column', gap: wp('2%')}}>
                    <View style={{display: 'flex', flexDirection: 'row', gap: wp('4%')}}>
                        <Text style={styles.rmtaLabel}>RMTA</Text>
                    </View>
                    <Text style={[styles.memberTypeLabel, {color: '#F2B233'}]}>{isAdmin ? t('adminMember') : t('technicianMember')}</Text>
                </View>

                <View style={styles.avatarCircle}>
                    {/* <Text style={styles.avatarText}>RK</Text> */}
                    <Image source={require('../../Assets/images/appLogo.png')} style={styles.avatarLogo} />
                </View>

              </View>
              

              <View style={[styles.profileCardSubCon, styles.profileRow]}>
                <View style={styles.photoCircle}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                  ) : (
                    <Text style={styles.photoInitial}>
                      {String(techName).trim().charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{techName}</Text>
                  {!!techRmtaId && <Text style={styles.memberId}>{techRmtaId}</Text>}
                  {!!techShop && <Text style={styles.shopName}>{techShop}</Text>}
                  {(!!techLocation || !!techValidUntil) && (
                    <Text style={styles.locationValidity}>
                      {techLocation}
                      {techValidUntil ? `${techLocation ? ' · ' : ''}${t('validTill')} ${techValidUntil}` : ''}
                    </Text>
                  )}
                </View>
              </View>

            </View>
          </View>

          {/* Your Details Section: only what the account actually has */}
          {[
            [t('mobile'), techMobile],
            [t('shop'), techShop],
            [t('location'), techLocation],
          ].filter(([, value]) => !!value).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('yourDetails')}</Text>
              <View style={styles.detailsCard}>
                {[
                  [t('mobile'), techMobile],
                  [t('shop'), techShop],
                  [t('location'), techLocation],
                ]
                  .filter(([, value]) => !!value)
                  .map(([label, value], idx, rows) => (
                    <View key={label}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>{label}</Text>
                        <Text style={styles.detailValue}>{value}</Text>
                      </View>
                      {idx < rows.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Admin details: only for a staff login, based on its member id */}
          {isStaff && (
            <View style={styles.section}>
              {/* The shop this staff login works for, instead of a generic "Your admin" heading */}
              <Text style={styles.worksAt}>You work at</Text>
              <Text style={styles.sectionTitle}>{adminProfile.shop_name || 'Shop details'}</Text>
              <View style={styles.detailsCard}>
                {[
                  ['Owner', adminProfile.full_name],
                  ['Mobile', adminProfile.mobile],
                  [
                    'Location',
                    [adminProfile.address, adminProfile.city, adminProfile.state].filter(Boolean).join(', '),
                  ],
                  ['Member code', user.member_id ? String(user.member_id) : ''],
                ]
                  .filter(([, value]) => !!value)
                  .map(([label, value], idx, rows) => (
                    <View key={label}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>{label}</Text>
                        <Text style={styles.detailValue}>{value}</Text>
                      </View>
                      {idx < rows.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                {!adminProfile.full_name && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Owner</Text>
                    <Text style={styles.detailValue}>Loading…</Text>
                  </View>
                )}
              </View>
              {!!adminProfile.mobile && (
                <TouchableOpacity
                  style={styles.callAdminBtn}
                  onPress={() => Linking.openURL(`tel:${adminProfile.mobile}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.callAdminText}>📞  Call shop owner</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.section}>
            {profileMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => {
                  if (item.id === 1) {
                    // My digital ID
                    onNavigate('myDigitalId');
                  } else if (item.id === 2) {
                    // Settings item
                    onNavigate('settings');
                  } else if (item.id === 3) {
                    // Purchase & sale history
                    onNavigate('purchaseAndSaleHistory');
                  } else if (item.id === 4) {
                    // Language
                    onNavigate('language', { fromSettings: true });
                  } else if (item.id === 5) {
                    onNavigate('helpSupport');
                  }
                }}
              >
                <View style={styles.menuIconContainer}>
                  <Image source={item.icon} style={styles.menuIcon} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Navigation */}
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
  headerTitle: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileCardContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2%'),
  },
  profileCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileCardLeft: {
    flex: 1,
  },
  rmtaLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memberTypeLabel: {
    fontSize: 14,
    // fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoInitial: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F2B233',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  locationValidity: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  profileCardBadge: {
    alignItems: 'center',
    gap: 8,
  },
  worksAt: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  callAdminBtn: {
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callAdminText: { fontSize: 14, fontWeight: '800', color: '#15803D' },
  activeBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  inactiveBadge: {
    backgroundColor: '#E5E7EB',
  },
  inactiveBadgeText: {
    color: '#6B7280',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLogo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },

  section: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailItem: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#8B5CF6',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuArrow: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: hp('1.8%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: hp('1.6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 120,
  },
});
