import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ENDPOINTS } from '../Constants/config';
import { getJson } from '../redux/slices/authSlice';

// Time the ticker takes to move one pixel: 16.7 ms is about 60 px per second.
const SPEED_MS_PER_PX = 16.7;

// One pass of the marquee: the content starts just past the right edge of the
// viewport and slides left until it's fully past the left edge, then jumps
// back to the right and repeats. On some Android devices/GPUs, that instant
// jump in a native-driven transform renders one ghost frame where the old
// (just-finished) position and the new (just-reset) position both show —
// which is what looked like one message's text overlapping the next one's.
// A brief fade to transparent timed around the jump hides that frame, so the
// jump itself is never visible, regardless of which device is rendering it.
function Marquee({ items, viewportWidth }) {
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useRef(new Animated.Value(viewportWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    return () => {
      stoppedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!contentWidth || !viewportWidth) return undefined;
    stoppedRef.current = false;
    const travel = viewportWidth + contentWidth;
    const duration = Math.max(4000, travel * SPEED_MS_PER_PX);
    const FADE_MS = 180;

    const runPass = () => {
      if (stoppedRef.current) return;
      // Jump happens here, while fully transparent.
      translateX.setValue(viewportWidth);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      Animated.timing(translateX, {
        toValue: -contentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || stoppedRef.current) return;
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished: faded }) => {
          if (faded && !stoppedRef.current) runPass();
        });
      });
    };

    runPass();
    return () => {
      stoppedRef.current = true;
    };
  }, [contentWidth, viewportWidth, translateX, opacity]);

  return (
    <Animated.View
      onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { opacity, transform: [{ translateX }] }]}
    >
      {items.map(item => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.text}>{item.text}</Text>
          <View style={styles.dot} />
        </View>
      ))}
    </Animated.View>
  );
}

// Scrolling announcement banner. Loads the messages from
// GET /public_app/getscroll -> { data: [{ id, description, d_in, i_ts }] } and
// scrolls them one after the other, each separated by a dot. While loading, or
// if the call fails or returns nothing, `fallbackText` is shown instead.
export default function ScrollTicker({ fallbackText, refreshKey = 0 }) {
  const [messages, setMessages] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(0);

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
  }, [refreshKey]);

  const items = messages.length
    ? messages
    : [{ id: 'fallback', text: fallbackText }];
  const signature = items.map(item => `${item.id}:${item.text}`).join('|');

  return (
    <View style={styles.ticker}>
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>📢</Text>
      </View>
      <View
        style={styles.viewport}
        onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}
      >
        {viewportWidth > 0 && (
          <Marquee key={signature} items={items} viewportWidth={viewportWidth} />
        )}
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
  },
  track: {
    position: 'absolute',
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
  },
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
