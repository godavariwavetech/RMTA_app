import { Alert, Linking, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { check, openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { showAppActionSheet } from './appModal';

const cameraPermission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

// react-native-image-picker reports a missing/denied permission with a raw,
// developer-facing native message (e.g. "...does not require
// manifest.permission.CAMERA..."), which is meaningless to a technician in
// the field. Catch that case and show a clear, actionable message instead.
const isPermissionError = response => {
  if (!response) return false;
  if (response.errorCode === 'permission' || response.errorCode === 'camera_unavailable') {
    return true;
  }
  return /permission/i.test(String(response.errorMessage || ''));
};

const showPermissionAlert = source => {
  Alert.alert(
    'Camera permission needed',
    `RMTA needs permission to use your ${source} to take a photo. Please allow it in Settings, then try again.`,
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => openSettings().catch(() => Linking.openSettings()),
      },
    ],
  );
};

const ensureCameraPermission = async () => {
  if (!cameraPermission) {
    Alert.alert('Camera unavailable', 'Camera permission is not supported on this device.');
    return false;
  }

  try {
    const current = await check(cameraPermission);
    const result = current === RESULTS.GRANTED ? current : await request(cameraPermission);
    if (result === RESULTS.GRANTED) return true;
    showPermissionAlert('camera');
    return false;
  } catch (error) {
    console.warn('[imagePicker] camera permission check failed:', error.message);
    Alert.alert('Camera unavailable', 'Camera permission could not be checked on this device.');
    return false;
  }
};

export function chooseImageSource(options = {}, onResponse) {
  const handleResponse = typeof onResponse === 'function' ? onResponse : () => {};

  const wrapResponse = source => response => {
    if (isPermissionError(response)) {
      showPermissionAlert(source);
      return;
    }
    handleResponse(response);
  };

  const pickFromLibrary = () =>
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.65,
        maxWidth: 1200,
        maxHeight: 1200,
        ...options,
      },
      wrapResponse('photo library'),
    );

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.65,
        maxWidth: 1200,
        maxHeight: 1200,
        ...options,
        selectionLimit: 1,
      },
      wrapResponse('camera'),
    );
  };

  showAppActionSheet('Add a photo', 'Choose where to get your image.', [
    {
      text: 'Take a photo',
      subtitle: 'Use your camera',
      icon: '📷',
      onPress: takePhoto,
    },
    {
      text: 'Choose from gallery',
      subtitle: 'Select an existing photo',
      icon: '🖼',
      onPress: pickFromLibrary,
    },
  ]);
}
