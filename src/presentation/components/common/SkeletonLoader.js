/**
 * SkeletonLoader - Placeholder animation for loading states
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '../../../theme';
import { borderRadius, spacing } from '../../../theme/spacing';

const SkeletonItem = ({ width, height = 16, borderRadiusValue = borderRadius.sm, style }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.3, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadiusValue,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

/**
 * Invoice card skeleton
 */
export const InvoiceCardSkeleton = () => (
  <View style={styles.invoiceCard}>
    <View style={styles.row}>
      <SkeletonItem width={100} height={14} />
      <SkeletonItem width={70} height={24} borderRadiusValue={12} />
    </View>
    <SkeletonItem width={180} height={16} style={styles.mt8} />
    <View style={[styles.row, styles.mt12]}>
      <SkeletonItem width={80} height={12} />
      <SkeletonItem width={90} height={18} />
    </View>
  </View>
);

/**
 * Render multiple skeleton cards
 */
export const InvoiceListSkeleton = ({ count = 5 }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <InvoiceCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  invoiceCard: {
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  listContainer: {
    paddingTop: spacing.md,
  },
});

export default SkeletonItem;
