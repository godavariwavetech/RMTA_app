import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'react-native-camera-kit';
import { check, openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Colors } from '../../../Constants/Colors';
import { showAppModal } from '../../../utils/appModal';

const cameraPermission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

export default function ScanQR({ onNavigate }) {
  const [permission, setPermission] = useState(RESULTS.UNAVAILABLE);
  const [loading, setLoading] = useState(true);
  const scanned = useRef(false);

  const requestCamera = useCallback(async () => {
    setLoading(true);
    try {
      const current = await check(cameraPermission);
      const result = current === RESULTS.GRANTED ? current : await request(cameraPermission);
      setPermission(result);
      if (result === RESULTS.BLOCKED) {
        showAppModal('Camera access needed', 'Enable camera access in Settings to scan QR codes.', [
          { text: 'Open Settings', onPress: () => openSettings().catch(() => Linking.openSettings()) },
        ]);
      } else if (result !== RESULTS.GRANTED) {
        showAppModal('Camera access needed', 'Allow camera access to scan QR codes.');
      }
    } catch (error) {
      setPermission(RESULTS.UNAVAILABLE);
      showAppModal('Camera unavailable', 'Camera access could not be checked on this device.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { requestCamera(); }, [requestCamera]);

  const handleReadCode = ({ nativeEvent }) => {
    if (scanned.current) return;
    const code = nativeEvent?.codeStringValue?.trim();
    if (!code) return;
    scanned.current = true;
    onNavigate?.('validQR', { scannedCode: code });
  };

  const hasPermission = permission === RESULTS.GRANTED;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate?.('goBack')}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR / Barcode Scanner</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Scan a code</Text>
        <Text style={styles.subtitle}>Hold a QR code or barcode inside the frame.</Text>
        <View style={styles.cameraFrame}>
          {hasPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              cameraType={CameraType.Back}
              scanBarcode
              allowedBarcodeTypes={['qr', 'code-128', 'code-39', 'ean-13', 'ean-8', 'upc-a', 'upc-e']}
              showFrame
              onReadCode={handleReadCode}
            />
          ) : (
            <View style={styles.permissionState}>
              {loading ? <ActivityIndicator size="large" color="#fff" /> : (
                <TouchableOpacity style={styles.retryButton} onPress={requestCamera}>
                  <Text style={styles.retryText}>Enable camera and retry</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.cameraHint}>{loading ? 'Starting camera…' : 'Camera permission is required to scan.'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.footerHint}>Your scanned code will be shown for review. Scanning does not verify membership.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { minHeight: hp('7%'), paddingHorizontal: wp('4%'), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  backButton: { width: wp('10%'), height: wp('10%'), alignItems: 'center', justifyContent: 'center' },
  backText: { color: Colors.primary, fontSize: wp('8%'), lineHeight: wp('9%') },
  headerTitle: { flex: 1, textAlign: 'center', color: Colors.primary, fontSize: wp('4.4%'), fontWeight: '700' },
  spacer: { width: wp('10%') },
  content: { flex: 1, padding: wp('5%'), justifyContent: 'center' },
  title: { fontSize: wp('5.5%'), fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: wp('3.6%'), color: '#64748B', marginTop: hp('0.6%'), marginBottom: hp('2.5%') },
  cameraFrame: { height: hp('52%'), overflow: 'hidden', borderRadius: wp('4%'), backgroundColor: '#101827' },
  permissionState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp('6%') },
  cameraHint: { color: '#E5E7EB', fontSize: wp('3.5%'), textAlign: 'center', marginTop: hp('2%') },
  retryButton: { borderRadius: wp('3%'), backgroundColor: Colors.primary, paddingHorizontal: wp('5%'), paddingVertical: hp('1.5%') },
  retryText: { color: '#fff', fontWeight: '700', fontSize: wp('3.8%') },
  footerHint: { color: '#64748B', fontSize: wp('3.2%'), lineHeight: wp('4.6%'), marginTop: hp('2%'), textAlign: 'center' },
});
