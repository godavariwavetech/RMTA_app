import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Drop-in replacement for <Image> that opens the photo full screen when tapped.
// Bundled placeholders (a require() source has no uri) stay as plain images.
export default function ViewableImage({ source, style, ...imageProps }) {
  const [open, setOpen] = useState(false);

  if (!source || !source.uri) {
    return <Image source={source} style={style} {...imageProps} />;
  }

  // The touchable takes the image's size, margins and border so the layout is
  // unchanged. resizeMode is image-only, so it stays on the image.
  const { resizeMode, ...box } = StyleSheet.flatten(style) || {};

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="View image full screen"
        style={[box, styles.clip]}
      >
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, { resizeMode }]}
          {...imageProps}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.screen}>
          <Image source={source} style={StyleSheet.absoluteFill} resizeMode="contain" />
          <TouchableOpacity
            style={styles.close}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close image"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  screen: { flex: 1, backgroundColor: '#000' },
  close: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 52,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '700', includeFontPadding: false },
});
