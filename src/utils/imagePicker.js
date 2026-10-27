import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { showAppActionSheet } from './appModal';

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
