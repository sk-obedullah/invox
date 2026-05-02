/**
 * AppButton - Reusable button component
 * Supports primary, secondary, outline, and text variants
 */

import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const getVariantStyles = useCallback(() => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.primaryLight },
          text: { color: colors.primary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.border,
          },
          text: { color: colors.textPrimary },
        };
      case 'text':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.primary },
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.error },
          text: { color: '#FFFFFF' },
        };
      case 'success':
        return {
          container: { backgroundColor: colors.success },
          text: { color: '#FFFFFF' },
        };
      default: // primary
        return {
          container: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' },
        };
    }
  }, [variant, colors]);

  const getSizeStyles = useCallback(() => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 14 },
          text: { fontSize: 13 },
          iconSize: 16,
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 28 },
          text: { fontSize: 16 },
          iconSize: 22,
        };
      default: // md
        return {
          container: { paddingVertical: 12, paddingHorizontal: 20 },
          text: { fontSize: 14 },
          iconSize: 18,
        };
    }
  }, [size]);

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <View style={styles.content}>
          {icon && !iconRight && (
            <Icon
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.text.color}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconRight && (
            <Icon
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.text.color}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default React.memo(AppButton);
