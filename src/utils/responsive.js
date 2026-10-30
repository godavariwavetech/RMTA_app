import { Dimensions, PixelRatio } from 'react-native';

// Drop-in replacement for react-native-responsive-screen's wp()/hp().
//
// The library sizes everything as a percentage of the screen, which is right on
// phones but makes everything huge on tablets (a 10% font on an iPad is ~80px).
// On a tablet we therefore size against a phone-sized reference screen, so the
// app looks like the phone layout (App.tsx centres it in a column of that width).
const TABLET_MIN_SIDE = 600;
const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 932;

export const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= TABLET_MIN_SIDE;
};

const percent = value => (typeof value === 'number' ? value : parseFloat(value));

export const widthPercentageToDP = value => {
  const base = isTablet() ? PHONE_WIDTH : Dimensions.get('window').width;
  return PixelRatio.roundToNearestPixel((base * percent(value)) / 100);
};

export const heightPercentageToDP = value => {
  const base = isTablet() ? PHONE_HEIGHT : Dimensions.get('window').height;
  return PixelRatio.roundToNearestPixel((base * percent(value)) / 100);
};

// Width of the column the app is drawn in (full width on phones).
export const APP_MAX_WIDTH = 640;
