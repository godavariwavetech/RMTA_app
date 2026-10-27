import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import { useDispatch } from 'react-redux';
import { Colors } from '../../Constants/Colors';
import { logoutUser } from '../../redux/slices/authSlice';

export default function TechnicianSettingsScreen({ onNavigate }) {
  const dispatch = useDispatch();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(true);

  const handleBackPress = () => {
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  const handleSignOut = async () => {
    await dispatch(logoutUser()); // clear the persisted session
    if (onNavigate) {
      onNavigate('logout');
    }
  };

  const settingsItems = [
    {
      id: 1,
      icon: require('../../Assets/icons/lockIcon.png'),
      title: 'Account security',
      subtitle: 'Update your password',
      type: 'action',
    },
    {
      id: 2,
      icon: require('../../Assets/icons/circle-check.png'),
      title: 'Push notifications enabled',
      type: 'toggle',
      state: pushNotifications,
      setState: setPushNotifications,
    },
    {
      id: 3,
      icon: require('../../Assets/icons/circle-check.png'),
      title: 'SMS transaction updates enabled',
      type: 'toggle',
      state: smsUpdates,
      setState: setSmsUpdates,
    },
    {
      id: 4,
      icon: require('../../Assets/icons/languageIcon.png'),
      title: 'Language',
      subtitle: 'English',
      type: 'action',
    },
    {
      id: 5,
      icon: require('../../Assets/icons/helpIcon.png'),
      title: 'Help & support',
      subtitle: 'RMTA association office',
      type: 'action',
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
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.mainSectionTitle}>Make RMTA work for you</Text>
          </View>

          {/* Settings Items */}
          <View style={styles.settingsContainer}>
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                activeOpacity={item.type === 'action' ? 0.7 : 1}
                onPress={item.type === 'action' ? () => {} : null}
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
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Save Preferences Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save preferences</Text>
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
