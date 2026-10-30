import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ENDPOINTS } from '../Constants/config';
import { getJson } from '../redux/slices/authSlice';

// Scrolling announcement banner. Loads the messages from
// GET /public_app/getscroll -> { data: [{ id, description, d_in, i_ts }] } and
// scrolls them one after the other, each separated by a dot. While loading, or
// if the call fails or returns nothing, `fallbackText` is shown instead.
export default function ScrollTicker({ fallbackText }) {
  const [messages, setMessages] = useState([]);
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { response, data } = await getJson(ENDPOINTS.GET_SCROLL, undefined, 10000);
        if (!active || !response.ok || !data || !Array.isArray(data.data)) return;
        setMessages(
          data.data
            .filter(row => row && !Number(row.d_in) && String(row.description || '').trim())
            .map(row => ({ id: row.id, text: String(row.description).trim() })),
        );
      } catch (e) {
        // keep the fallback text
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The track holds two identical copies side by side; sliding left by the
  // width of one copy and restarting makes the loop seamless.
  useEffect(() => {
    if (!contentWidth) return undefined;
    translateX.setValue(0);
    const distance = contentWidth / 2;
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -distance,
        duration: Math.max(12000, distance * 28),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [contentWidth, translateX]);

  const items = messages.length
    ? messages
    : [{ id: 'fallback', text: fallbackText }];

  const renderCopy = copy => (
    <View key={copy} style={styles.copy}>
      {items.map(item => (
        <View key={`${copy}-${item.id}`} style={styles.item}>
          <Text style={styles.text}>{item.text}</Text>
          <View style={styles.dot} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.ticker}>
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>📢</Text>
      </View>
      <View style={styles.viewport}>
        <Animated.View
          onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
          style={[styles.track, { transform: [{ translateX }] }]}
        >
          {renderCopy(0)}
          {renderCopy(1)}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticker: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#193057',
    borderWidth: 1,
    borderColor: '#3E5B86',
  },
  badge: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2244',
    borderRightWidth: 1,
    borderRightColor: '#3E5B86',
  },
  badgeIcon: { fontSize: 18 },
  viewport: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 12,
  },
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    flexShrink: 0,
    alignItems: 'center',
  },
  copy: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  item: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    includeFontPadding: false,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F2B233',
    marginHorizontal: 22,
  },
});
