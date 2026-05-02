/**
 * AppCard - Reusable card component with elevation and press support
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AppCard = ({
  children,
  onPress,
  style,
  elevationLevel = 'sm',
  padding = spacing.base,
  animated = false,
  animationDelay = 0,
  borderLeftColor,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const cardStyle = [
    styles.card,
    elevation[elevationLevel],
    {
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
      padding,
    },
    borderLeftColor && {
      borderLeftWidth: 4,
      borderLeftColor,
    },
    style,
  ];

  const content = onPress ? (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={cardStyle}
    >
      {children}
    </TouchableOpacity>
  ) : (
    <View style={cardStyle}>{children}</View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInDown.delay(animationDelay).duration(400).springify()}>
        {content}
      </Animated.View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default React.memo(AppCard);
