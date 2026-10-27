import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export function chooseImageSource(onResponse, options = {}) {
  const pickFromLibrary = () =>
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.7,
        ...options,
      },
      onResponse,
    );

  const takePhoto = () =>
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.7,
        ...options,
        selectionLimit: 1,
      },
      onResponse,
    );

  Alert.alert('Add photo', 'Choose how you want to add the image.', [
    { text: 'Take photo', onPress: takePhoto },
    { text: 'Choose from gallery', onPress: pickFromLibrary },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
