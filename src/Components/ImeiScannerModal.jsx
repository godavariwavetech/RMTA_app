import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { check, openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

import { Colors } from '../Constants/Colors';
import { isValidImei } from '../utils/imeiValidation';

const cameraPermission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

// IMEI labels are normally Code 128 barcodes (sometimes a QR). The scanned text
// can hold extra characters or two numbers, so pull out the 15-digit IMEI,
// preferring one that passes the checksum.
export function extractImei(text) {
  const matches = String(text || '').match(/\d{15}/g) || [];
  return matches.find(isValidImei) || matches[0] || null;
}

// Full-screen camera that reads an IMEI barcode and hands the number back.
const GUIDE_HEIGHT = 170;

export default function ImeiScannerModal({ visible, onScanned, onClose }) {
  const { height: windowHeight } = useWindowDimensions();
  const [permission, setPermission] = useState(RESULTS.UNAVAILABLE);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const handled = useRef(false);

  const requestCamera = useCallback(async () => {
    setLoading(true);
    try {
      const current = await check(cameraPermission);
      const result = current === RESULTS.GRANTED ? current : await request(cameraPermission);
      setPermission(result);
    } catch (e) {
      setPermission(RESULTS.UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }, []);

  // Each time the scanner opens: reset and make sure the camera is allowed.
  useEffect(() => {
    if (visible) {
      handled.current = false;
      setNotice('');
      setTorchOn(false);
      requestCamera();
    }
  }, [visible, requestCamera]);

  const handleReadCode = ({ nativeEvent }) => {
    if (handled.current) return;
    const text = nativeEvent && nativeEvent.codeStringValue;
    const imei = extractImei(text);
    if (!imei) {
      // Not an IMEI (e.g. a serial number barcode): keep scanning.
      setNotice('That code does not contain a 15-digit IMEI. Try the other barcode.');
      return;
    }
    handled.current = true;
    onScanned(imei);
  };

  const hasPermission = permission === RESULTS.GRANTED;

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        <StatusBar backgroundColor="#000" barStyle="light-content" translucent />
        {hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            cameraType={CameraType.Back}
            scanBarcode
            allowedBarcodeTypes={['code-128', 'code-39', 'itf', 'ean-13', 'qr', 'data-matrix']}
            // showFrame stays off: with it on, only codes fully inside the
            // library's small frame are reported, so most were missed.
            scanThrottleDelay={400}
            torchMode={torchOn ? 'on' : 'off'}
            zoomMode="on"
            onReadCode={handleReadCode}
          />
        ) : (
          <View style={styles.permission}>
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Text style={styles.permissionText}>Camera permission is needed to scan the IMEI.</Text>
                <TouchableOpacity style={styles.button} onPress={requestCamera}>
                  <Text style={styles.buttonText}>Allow camera</Text>
                </TouchableOpacity>
                {permission === RESULTS.BLOCKED && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonAlt]}
                    onPress={() => openSettings().catch(() => Linking.openSettings())}
                  >
                    <Text style={styles.buttonText}>Open Settings</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {hasPermission && (
          <View
            pointerEvents="none"
            style={[styles.guideBox, { top: (windowHeight - GUIDE_HEIGHT) / 2 - 20 }]}
          />
        )}

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan IMEI barcode</Text>
          {hasPermission && (
            <TouchableOpacity
              style={[styles.close, styles.torch, torchOn && styles.torchOn]}
              onPress={() => setTorchOn(v => !v)}
              accessibilityLabel="Toggle torch"
            >
              <Text style={styles.torchText}>🔦</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.hint}>
            {notice || 'Point the camera at the IMEI barcode on the box or under the battery / SIM tray.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  permissionText: { color: '#E5E7EB', fontSize: 15, textAlign: 'center', marginBottom: 18 },
  button: { backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 26 },
  buttonAlt: { marginTop: 12, backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Absolute, full-width box; `top` is set from the screen height at render time.
  guideBox: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: GUIDE_HEIGHT,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 52,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '700', includeFontPadding: false },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginLeft: 14, flex: 1 },
  torch: { marginLeft: 8 },
  torchOn: { backgroundColor: '#F2B233' },
  torchText: { fontSize: 18, includeFontPadding: false },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    paddingBottom: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
