import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../utils/responsive';

import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { useI18n, LANGUAGES } from '../../i18n';
import { logoutUser } from '../../redux/slices/authSlice';
import { getAppLockEnabled, isLockAvailable, setAppLockEnabled } from '../../utils/appLock';
import { confirmAction } from '../../utils/appModal';
import { TERMS_URL } from '../../Constants/config';

export default function TechnicianSettingsScreen({ onNavigate }) {
  const { t, language } = useI18n();
  const dispatch = useDispatch();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);
  // App lock (Face ID / fingerprint / passcode when the app opens).
  const [appLock, setAppLock] = useState(true);
  const [lockAvailable, setLockAvailable] = useState(true);
  useEffect(() => {
    getAppLockEnabled().then(setAppLock);
    isLockAvailable().then(setLockAvailable);
  }, []);
  const toggleAppLock = value => {
    setAppLock(value);
    setAppLockEnabled(value);
  };

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  const handleSignOut = () => {
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

  const settingsItems = [
    {
      id: 1,
      icon: require('../../Assets/icons/lockIcon.png'),
      title: t('accountSecurity'),
      subtitle: t('updatePassword'),
      type: 'action',
    },
    {
      id: 2,
      icon: require('../../Assets/icons/circle-check.png'),
      title: t('pushEnabled'),
      type: 'toggle',
      state: pushNotifications,
      setState: setPushNotifications,
    },
    {
      id: 3,
      icon: require('../../Assets/icons/circle-check.png'),
      title: t('smsEnabled'),
      type: 'toggle',
      state: smsUpdates,
      setState: setSmsUpdates,
    },
    {
      id: 6,
      icon: require('../../Assets/icons/lockIcon.png'),
      title: 'App lock',
      subtitle: lockAvailable
        ? 'Ask for Face ID, fingerprint or passcode when the app opens'
        : 'Set a screen lock on this phone to use it',
      type: 'toggle',
      state: appLock && lockAvailable,
      setState: toggleAppLock,
      disabled: !lockAvailable,
    },
    {
      id: 4,
      icon: require('../../Assets/icons/languageIcon.png'),
      title: t('language'),
      subtitle: LANGUAGES.find(l => l.code === language)?.native,
      type: 'action',
      onPress: () => onNavigate && onNavigate('language', { fromSettings: true }),
    },
    {
      id: 5,
      icon: require('../../Assets/icons/helpIcon.png'),
      title: t('helpSupport'),
      subtitle: t('rmtaOffice'),
      type: 'action',
      onPress: () => onNavigate && onNavigate('helpSupport'),
    },
    {
      id: 7,
      icon: require('../../Assets/icons/helpIcon.png'),
      title: 'Terms & Conditions',
      type: 'action',
      onPress: () =>
        Linking.openURL(TERMS_URL).catch(() =>
          alert('Could not open the Terms & Conditions page.'),
        ),
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
        {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('settings')}</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.mainSectionTitle}>{t('makeRmtaWork')}</Text>
          </View>

          {/* Settings Items */}
          <View style={styles.settingsContainer}>
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                activeOpacity={item.type === 'action' ? 0.7 : 1}
                onPress={item.type === 'action' ? item.onPress || (() => {}) : null}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Image source={item.icon} style={styles.settingIcon} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                {item.type === 'toggle' && (
                  <Switch
                    style={styles.toggle}
                    value={item.state}
                    disabled={item.disabled}
                    onValueChange={item.setState}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={item.state ? Colors.primary : '#FFFFFF'}
                  />
                )}
                {item.type === 'action' && (
                  <Text style={styles.settingArrow}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Out Button */}
          <View style={styles.signOutContainer}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>{t('signOut')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Save Preferences Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{t('savePreferences')}</Text>
          </TouchableOpacity>
        </View>
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
    // backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    // padding: 8,
    width: wp('14%'),
    height: wp('14%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dddadaff',
    textAlign: 'center',
    borderRadius: wp('5%')
  },
  backButtonText: {
    fontSize: wp('10%'),
    color: Colors.primary,
    fontWeight: '300',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: 44,
  },
  sectionTitleContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsContainer: {
    paddingHorizontal: wp('5%'),
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    // tintColor: Colors.primary,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  toggle: {
    marginLeft: 12,
  },
  settingArrow: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
    marginLeft: 12,
  },
  signOutContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    marginTop: hp('2%'),
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  bottomSpacer: {
    height: 20,
  },
  saveButtonContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
