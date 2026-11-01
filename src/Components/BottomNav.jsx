import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from 'react-native';

import { useI18n } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The bar drifts through deep cool shades (navy, blue, indigo, violet, teal) and the
// centre button through light warm ones (amber, peach, yellow, rose, pink) at the same
// moment. Cool against warm always contrasts and stays easy on the eye. Each pair keeps
// a contrast of at least 4:1 between bar and button, white labels on the bar at least
// 7:1, and the dark "+" on the button at least 8.9:1. Both lists end where they start so
// the animation loops without a jump.
const BAR_COLORS = ['#0B2A66', '#1E3A8A', '#3730A3', '#5B21B6', '#115E59', '#155E75', '#1E40AF', '#0B2A66'];
const BUTTON_COLORS = ['#FBBF24', '#FDBA74', '#FDE047', '#FACC15', '#FDA4AF', '#F9A8D4', '#FBBF24', '#FBBF24'];

// A soft radial gradient on the centre button without a gradient library: stacked white
// circles of growing transparency-sum toward a highlight point at the upper left, laid
// over the animated base colour. The base keeps cycling, so the gradient follows it.
const GLOSS_SIZES = [58, 48, 38, 28, 18];
const GLOSS_CENTER = { x: 20, y: 18 };
// A few faint circles pushed toward the lower right darken that side in steps, which
// reads as a smooth gradient rather than one hard edge.
const SHADE_OFFSETS = [14, 20, 26];

const loop = (value, duration, easing = Easing.linear, useNativeDriver = true) =>
  Animated.loop(
    Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver }),
  );

export default function BottomNav({ selectedItem, onNavigate }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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
      <View
        style={[
          styles.bottomNavContainer,
          { bottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 0) + 8 },
        ]}
        pointerEvents="box-none"
      >
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
                {/* Selected tab: a rounded rectangle of one fixed size behind icon and label. */}
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
              {GLOSS_SIZES.map(size => (
                <View
                  key={size}
                  pointerEvents="none"
                  style={[
                    styles.gloss,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      left: GLOSS_CENTER.x - size / 2,
                      top: GLOSS_CENTER.y - size / 2,
                    },
                  ]}
                />
              ))}
              {SHADE_OFFSETS.map(offset => (
                <View
                  key={offset}
                  pointerEvents="none"
                  style={[styles.shade, { left: offset, top: offset + 2 }]}
                />
              ))}
              <Text style={styles.centerPlus}>+</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The bar floats over the screen instead of taking its own strip below the content,
  // so content scrolls underneath it and nothing is cut off above it. box-none lets
  // taps in the gaps around the bar pass through to the screen.
  bottomNavContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  itemInnerSelected: { backgroundColor: 'rgba(255,255,255,0.24)' },
  navIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginBottom: 2,
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
    overflow: 'hidden',
  },
  gloss: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.085)' },
  // Slight darkening toward the lower right to give the gradient depth.
  shade: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(15,23,42,0.045)',
  },
  centerPlus: { color: '#0B1B3F', fontSize: 38, fontWeight: '300', lineHeight: 42, marginTop: -3 },
});
