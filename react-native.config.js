/**
 * React Native Config
 * Configures native module linking and asset paths
 */
module.exports = {
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
  dependencies: {
    // react-native-vector-icons needs font assets copied
    'react-native-vector-icons': {
      platforms: {
        ios: null, // Not building for iOS
      },
    },
  },
};
