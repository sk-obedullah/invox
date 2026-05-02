/**
 * ConfirmDialog - Reusable confirmation modal
 * Uses React Native Modal instead of Paper Portal/Dialog to avoid theme context issues
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';

const ConfirmDialog = ({
  visible,
  onDismiss,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.button, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.button,
                {
                  backgroundColor: destructive ? colors.errorLight : colors.primaryLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: destructive ? colors.error : colors.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default React.memo(ConfirmDialog);
