import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// A grey block that pulses while content is loading.
export function Skeleton({ width = '100%', height = 14, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E5E7EB', opacity },
        style,
      ]}
    />
  );
}

// Placeholder for a list of cards (device/job/user rows).
export function SkeletonCardList({ count = 4, withImage = true }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardTop}>
            {withImage && <Skeleton width={56} height={56} radius={12} />}
            <View style={styles.cardLines}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="45%" height={12} style={styles.gap} />
              <Skeleton width="55%" height={12} style={styles.gap} />
            </View>
          </View>
          <Skeleton width="35%" height={12} style={styles.gapLg} />
          <Skeleton height={12} style={styles.gap} />
          <Skeleton height={12} style={styles.gap} />
        </View>
      ))}
    </View>
  );
}

// Placeholder shaped like a job card: job code, device name, customer line,
// then price and status badge. Always full width.
export function SkeletonJobList({ count = 5 }) {
  return (
    <View style={styles.jobList}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.jobCard}>
          <Skeleton width="38%" height={14} />
          <Skeleton width="62%" height={18} style={styles.gap} />
          <Skeleton width="85%" height={12} style={styles.gap} />
          <View style={styles.jobFooter}>
            <Skeleton width={70} height={16} />
            <Skeleton width={64} height={22} radius={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Placeholder shaped like a Supporters user card: avatar, name + member code,
// status badge, then three label/value rows. Always full width.
export function SkeletonUserList({ count = 5 }) {
  return (
    <View style={styles.jobList}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.userCard}>
          <View style={styles.userTop}>
            <Skeleton width={44} height={44} radius={22} />
            <View style={styles.userLines}>
              <Skeleton width="55%" height={15} />
              <Skeleton width="35%" height={11} style={styles.gap} />
            </View>
            <Skeleton width={54} height={22} radius={11} />
          </View>
          {[0, 1, 2].map(row => (
            <View key={row} style={styles.userRow}>
              <Skeleton width="22%" height={12} />
              <Skeleton width="38%" height={12} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Placeholder for a details page: a summary block plus a few label/value rows.
export function SkeletonDetails({ rows = 6 }) {
  return (
    <View>
      <Skeleton height={110} radius={16} />
      <View style={[styles.card, styles.detailsCard]}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={styles.detailRow}>
            <Skeleton width="30%" height={13} />
            <Skeleton width="40%" height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardLines: { flex: 1, marginLeft: 12 },
  jobList: { width: '100%' },
  userCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    padding: 15,
    marginBottom: 12,
  },
  userTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  userLines: { flex: 1, marginHorizontal: 12 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  jobCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F1F3',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gap: { marginTop: 8 },
  gapLg: { marginTop: 16 },
  detailsCard: { marginTop: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
});
