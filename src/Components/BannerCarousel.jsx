import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AUTO_SCROLL_MS = 4500;
// The banner area is a FIXED size: full width, 180 px tall, whatever picture is in it. The
// picture is set to exactly that width and height (it does not change the area's size). For a
// perfect fit use a 2:1 picture (e.g. 1600 x 800 px): on a typical phone the area is about 2:1.
const BANNER_HEIGHT = 180;

// Last measured width, kept across mounts: the carousel is rebuilt every time the
// Home screen is opened, and starting from width 0 meant an empty frame (the banners
// vanishing and reappearing) until onLayout reported the width again.
let lastWidth = 0;

// Swipeable banner strip with dots that also advances by itself. Each slide is
//   { id, image }                          – a picture banner, or
//   { id, title, subtitle, color }         – a text banner on a coloured card
// plus an optional `onPress`.
export default function BannerCarousel({ slides }) {
  const scrollRef = useRef(null);
  const [width, setWidth] = useState(lastWidth);
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
    <View style={styles.container} onLayout={e => {
        const w = e.nativeEvent.layout.width;
        lastWidth = w;
        setWidth(prev => (prev === w ? prev : w));
      }}>
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
                <View style={styles.imageFrame}>
                  {/* The picture only: sharp, shown whole (never cropped) and centred. */}
                  <Image source={slide.image} style={styles.image} />
                </View>
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
  slide: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  imageFrame: { width: '100%', height: BANNER_HEIGHT, backgroundColor: '#FFFFFF' },
  // stretch: the picture is set to exactly the area's width and height, so it always fills it.
  image: { width: '100%', height: BANNER_HEIGHT, resizeMode: 'stretch' },
  textSlide: {
    height: BANNER_HEIGHT,
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
