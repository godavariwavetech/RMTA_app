import React, { useState } from 'react';
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
import useAccountProfile from '../../utils/useAccountProfile';
import BottomNav from '../../Components/BottomNav';
import { logoutUser } from '../../redux/slices/authSlice';

export default function TechnicianProfileScreen({ onNavigate }) {
  const { t, language } = useI18n();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user) || {};
  const [selectedNavItem, setSelectedNavItem] = useState('profile');

  // Full profile (admin_details for admins, technician_details for technicians).
  const profile = useAccountProfile();

  // View model: fetched profile → cached login user → placeholders.
  const d = profile;
  const techName = d.full_name || 'Technician';
  const techMobile = d.mobile || '—';
  const techShop = d.shop_name || '—';
  const techLocation = [d.city, d.state].filter(Boolean).join(', ') || '—';
  const techRmtaId = d.member_code || '—';
  const techValidUntil = d.valid_until;
  const isAdmin = user.role === 'admin';
  const isActive = isAdmin
    ? String(d.account_status || '').toLowerCase() === 'active'
    : user.technician_status === 'active';

  const handleNavigation = (screen) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser()); // clear the persisted session
    if (onNavigate) {
      onNavigate('logout');
    }
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
                        <View style={[styles.activeBadge, !isActive && styles.inactiveBadge]}>
                            <Text style={[styles.activeBadgeText, !isActive && styles.inactiveBadgeText]}>
                                {isActive ? `✓ ${t('active')}` : t('inactive')}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.memberTypeLabel, {color: '#F2B233'}]}>{isAdmin ? t('adminMember') : t('technicianMember')}</Text>
                </View>

                <View style={styles.avatarCircle}>
                    {/* <Text style={styles.avatarText}>RK</Text> */}
                    <Image source={require('../../Assets/images/appLogo.png')} style={{height: wp('12%'), width: wp('12%')}} />
                </View>

              </View>
              

              <View style={styles.profileCardSubCon}>
                <Text style={styles.profileName}>{techName}</Text>
                <Text style={styles.memberId}>{techRmtaId}</Text>
                <Text style={styles.shopName}>{techShop}</Text>
                <Text style={styles.locationValidity}>
                  {techLocation}
                  {techValidUntil ? ` · ${t('validTill')} ${techValidUntil}` : ''}
                </Text>
              </View>

            </View>
          </View>

          {/* Your Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('yourDetails')}</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('mobile')}</Text>
                <Text style={styles.detailValue}>{techMobile}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('shop')}</Text>
                <Text style={styles.detailValue}>{techShop}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('location')}</Text>
                <Text style={styles.detailValue}>{techLocation}</Text>
              </View>
            </View>
          </View>

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
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 12,
    color: '#D1D5DB',
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
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
  bottomSpacer: {
    height: 120,
  },
});
