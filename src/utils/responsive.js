import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales the size based on the screen width
 */
export const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales the size based on the screen height
 */
export const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale that allows for a factor of scaling
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Scales font size with a maximum limit to prevent overlapping
 */
export const moderateFontScale = (size, factor = 0.5) => {
  const scaledSize = moderateScale(size, factor);
  // Cap font scaling for accessibility settings to prevent UI breaks
  const fontScale = PixelRatio.getFontScale();
  return scaledSize / (fontScale > 1.2 ? 1.2 : fontScale);
};

export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH > 600;

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateFontScale,
  isSmallDevice,
  isTablet,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
