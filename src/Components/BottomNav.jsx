import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';

import {
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export default function BottomNav({ selectedItem, onNavigate }) {
  const navItems = [
    { id: 'home', icon: require('../Assets/icons/home.png'), label: 'Home' },
    { id: 'jobs', icon: require('../Assets/icons/clipboard.png'), label: 'Jobs' },
    { id: 'add', icon: require('../Assets/icons/addButton.png'), label: 'Add', isCenter: true },
    { id: 'reports', icon: require('../Assets/bottomTabIcons/reports.png'), label: 'Reports' },
    { id: 'profile', icon: require('../Assets/icons/profile.png'), label: 'Profile' },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItemCenter}
                onPress={() => onNavigate('createJobSheetStep1', { fresh: true })}
              >
                <Image source={item.icon} style={styles.navIconCenter} />
              </TouchableOpacity>
            );
          }

          const isSelected = selectedItem === item.id;
          const tintColor = isSelected ? '#2F5DDC' : '#596579';
          const textColor = isSelected ? '#2F5DDC' : '#596579';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onNavigate(item.id)}
            >
              <Image
                source={item.icon}
                style={[styles.navIcon, { tintColor }]}
              />
              <Text style={[styles.navLabel, { color: textColor }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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
    width: 56,
    height: 56,
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
