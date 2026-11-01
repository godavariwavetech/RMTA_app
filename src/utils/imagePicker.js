import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { showAppActionSheet } from './appModal';

export function chooseImageSource(options = {}, onResponse) {
  const handleResponse = typeof onResponse === 'function' ? onResponse : () => {};

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
      handleResponse,
    );

  const takePhoto = () =>
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
      handleResponse,
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
