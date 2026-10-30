import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AUTO_SCROLL_MS = 4500;

// Swipeable banner strip with dots that also advances by itself. Each slide is
//   { id, image }                          – a picture banner, or
//   { id, title, subtitle, color }         – a text banner on a coloured card
// plus an optional `onPress`.
export default function BannerCarousel({ slides }) {
  const scrollRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const touching = useRef(false);

  const goTo = (i, animated = true) => {
    indexRef.current = i;
    setIndex(i);
    if (scrollRef.current && width) {
      scrollRef.current.scrollTo({ x: i * width, y: 0, animated });
    }
  };

  // Advance every few seconds unless the user is dragging.
  useEffect(() => {
    if (!width || slides.length < 2) return undefined;
    const timer = setInterval(() => {
      if (touching.current) return;
      goTo((indexRef.current + 1) % slides.length);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, slides.length]);

  return (
    <View style={styles.container} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => {
            touching.current = true;
          }}
          onMomentumScrollEnd={e => {
            touching.current = false;
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            indexRef.current = i;
            setIndex(i);
          }}
          onScrollEndDrag={() => {
            // A drag that doesn't glide still ends here.
            setTimeout(() => {
              touching.current = false;
            }, 600);
          }}
        >
          {slides.map(slide => (
            <TouchableOpacity
              key={slide.id}
              activeOpacity={slide.onPress ? 0.85 : 1}
              onPress={slide.onPress}
              style={[styles.slide, { width }]}
            >
              {slide.image ? (
                <Image source={slide.image} style={styles.image} />
              ) : (
                <View style={[styles.textSlide, { backgroundColor: slide.color || '#2F5DDC' }]}>
                  <View style={styles.copy}>
                    <Text style={[styles.eyebrow, { color: slide.accent || '#8BB8FF' }]}>RMTA MEMBER TOOLS</Text>
                    <Text style={styles.title}>{slide.title}</Text>
                    {!!slide.subtitle && <Text style={styles.subtitle}>{slide.subtitle}</Text>}
                  </View>
                  <View style={[styles.iconCircle, { backgroundColor: `${slide.accent || '#8BB8FF'}24` }]}>
                    <Text style={[styles.iconText, { color: slide.accent || '#8BB8FF' }]}>{slide.symbol || '✦'}</Text>
                  </View>
                  <View style={[styles.decorOne, { borderColor: `${slide.accent || '#8BB8FF'}24` }]} />
                  <View style={[styles.decorTwo, { backgroundColor: `${slide.accent || '#8BB8FF'}12` }]} />
                  <View style={styles.openHint}>
                    <Text style={styles.openHintText}>›</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <TouchableOpacity key={slide.id} onPress={() => goTo(i)} hitSlop={8}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 14, marginBottom: 8 },
  slide: { borderRadius: 16, overflow: 'hidden' },
  image: { width: '100%', height: 180, resizeMode: 'cover' },
  textSlide: {
    height: 178,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: { flex: 1, zIndex: 1, paddingRight: 4 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 9 },
  title: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', maxWidth: '100%', lineHeight: 26 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 7, maxWidth: '100%', lineHeight: 17 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 8, zIndex: 1 },
  iconText: { fontSize: 30, fontWeight: '700' },
  openHint: { position: 'absolute', bottom: 14, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  openHintText: { color: '#FFFFFF', fontSize: 23, lineHeight: 25, fontWeight: '400', marginTop: -2 },
  decorOne: {
    position: 'absolute',
    right: -48,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
  },
  decorTwo: {
    position: 'absolute',
    right: 35,
    bottom: -68,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { width: 22, backgroundColor: '#2F5DDC' },
});
