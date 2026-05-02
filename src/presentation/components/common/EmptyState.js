/**
 * EmptyState - Shown when lists have no data
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppButton from './AppButton';
import { useAppTheme } from '../../../theme';
import { spacing } from '../../../theme/spacing';

const EmptyState = ({
  icon = 'file-document-outline',
  title = 'Nothing here yet',
  message = 'Get started by creating your first item',
  actionLabel,
  onAction,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <Icon name={icon} size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          icon="plus"
          style={styles.button}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    minHeight: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 160,
  },
});

export default React.memo(EmptyState);
