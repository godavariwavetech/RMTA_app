import React from 'react';
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

import { Colors } from '../../Constants/Colors';
import BottomNav from '../../Components/BottomNav';

export default function NotificationsScreen({ onNavigate }) {
  const [selectedNavItem, setSelectedNavItem] = React.useState('home');

  const handleNavigation = (screen) => {
    setSelectedNavItem(screen);
    if (onNavigate) {
      onNavigate(screen);
    }
  };
  const notifications = [
    {
      id: 1,
      icon: require('../../Assets/icons/clipboard.png'),
      title: 'Job ready for quality check',
      subtitle: 'JS-2406240001 - 10 minutes ago',
      bgColor: '#DBEAFE',
    },
    {
      id: 2,
      icon: require('../../Assets/icons/circle-check.png'),
      title: 'Membership is active',
      subtitle: 'Your ID is valid until 31 Dec 2027',
      bgColor: '#DCFCE7',
    },
    {
      id: 3,
      icon: require('../../Assets/icons/pending.png'),
      title: 'Purchase saved',
      subtitle: 'OnePlus 9R - ₹18,500',
      bgColor: '#FEF08A',
    },
  ];

  const today = new Date();
  const dateString = `Today · ${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;

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
            <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.placeholderButton} />
          </View>
        <ScrollView showsVerticalScrollIndicator={false}>


          {/* Status Section */}
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>You're up to date</Text>
            <Text style={styles.statusDate}>{dateString}</Text>
          </View>

          {/* Notifications List */}
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity key={notification.id} style={styles.notificationItem}>
                <View style={[styles.notificationIcon, { backgroundColor: notification.bgColor }]}>
                  <Image source={notification.icon} style={styles.notificationIconImage} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationSubtitle}>{notification.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
  header: {
    // backgroundColor: Colors.primary,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    width: wp('10%'),
    height: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
    // color: '#0000'
  },
  backButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    color: '#0000',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    color: '#0000'
  },
  placeholderButton: {
    width: 44,
  },
  statusSection: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  notificationsList: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacer: {
    height: 120,
  },
});
