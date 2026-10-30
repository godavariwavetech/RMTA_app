import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';

import { useI18n } from '../i18n';

// Colours the centre button cycles through (ends where it starts, so it loops).
const BUTTON_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EF4444'];
// The bar follows the same colour at the same moment, in a deeper shade so the
// white icons and labels stay readable.
const BAR_COLORS = ['#B91C1C', '#C2410C', '#A16207', '#15803D', '#0E7490', '#1D4ED8', '#6D28D9', '#B91C1C'];

const loop = (value, duration, easing = Easing.linear, useNativeDriver = true) =>
  Animated.loop(
    Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver }),
  );

export default function BottomNav({ selectedItem, onNavigate }) {
  const { t } = useI18n();
  const buttonHue = useRef(new Animated.Value(0)).current;
  const centerFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const hue = loop(buttonHue, 7000, Easing.linear, false); // colours can't use the native driver
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(centerFloat, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(centerFloat, {
          toValue: 0,
          duration: 1150,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    hue.start();
    floating.start();
    return () => {
      hue.stop();
      floating.stop();
    };
  }, [buttonHue, centerFloat]);

  const navItems = [
    { id: 'home', icon: require('../Assets/icons/home.png'), label: t('navHome') },
    { id: 'jobs', icon: require('../Assets/icons/clipboard.png'), label: t('navJobs') },
    { id: 'add', isCenter: true },
    { id: 'reports', icon: require('../Assets/bottomTabIcons/reports.png'), label: t('navReports') },
    { id: 'profile', icon: require('../Assets/icons/profile.png'), label: t('navProfile') },
  ];

  const centerY = centerFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const inputRange = BUTTON_COLORS.map((_, i) => i / (BUTTON_COLORS.length - 1));
  const buttonColor = buttonHue.interpolate({ inputRange, outputRange: BUTTON_COLORS });
  const barColor = buttonHue.interpolate({ inputRange, outputRange: BAR_COLORS });

  return (
    <View style={styles.bottomNavContainer}>
      <Animated.View style={[styles.navBarShell, { backgroundColor: barColor }]}>
        <View style={styles.bottomNav}>
          {navItems.map(item => {
            if (item.isCenter) {
              return <View key={item.id} style={styles.centerSpacer} />;
            }

            const isSelected = selectedItem === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => onNavigate(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.itemInner, isSelected && styles.itemInnerSelected]}>
                  <Image
                    source={item.icon}
                    style={[styles.navIcon, { tintColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.8)' }]}
                  />
                  <Text style={[styles.navLabel, isSelected && styles.navLabelSelected]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Animated.View style={[styles.floatingCenter, { transform: [{ translateY: centerY }] }]}>
          <TouchableOpacity
            onPress={() => onNavigate('createJobSheetStep1', { fresh: true })}
            accessibilityRole="button"
            accessibilityLabel={t('navAdd')}
          >
            <Animated.View style={[styles.centerButton, { backgroundColor: buttonColor }]}>
              <Text style={styles.centerPlus}>+</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  // The shell needs its own background: Android draws the elevation shadow from
  // the view's shape, and with no background it outlined the label text
  // (white boxes behind "Home", "Jobs", …).
  navBarShell: {
    height: 68,
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: '#1B1340',
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bottomNav: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  centerSpacer: { flex: 1 },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  itemInnerSelected: { backgroundColor: 'rgba(255,255,255,0.22)' },
  navIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  navLabelSelected: { color: '#FFFFFF', fontWeight: '800' },
  floatingCenter: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -33,
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#092D68',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlus: { color: '#FFFFFF', fontSize: 38, fontWeight: '300', lineHeight: 42, marginTop: -3 },
});
