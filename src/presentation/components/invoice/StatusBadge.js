/**
 * StatusBadge - Invoice status chip
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../theme';
import { INVOICE_STATUS_LABELS } from '../../../constants/invoiceStatus';
import { borderRadius } from '../../../theme/spacing';

const StatusBadge = ({ status, size = 'sm' }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const getStatusStyle = () => {
    switch (status) {
      case 'paid':
        return { bg: colors.successLight, text: colors.success };
      case 'sent':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'overdue':
        return { bg: colors.errorLight, text: colors.error };
      case 'cancelled':
        return { bg: colors.warningLight, text: colors.warning };
      default: // draft
        return { bg: colors.surfaceVariant, text: colors.textSecondary };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={[
      styles.badge,
      { backgroundColor: statusStyle.bg },
      size === 'lg' && styles.badgeLg,
    ]}>
      <View style={[styles.dot, { backgroundColor: statusStyle.text }]} />
      <Text style={[
        styles.text,
        { color: statusStyle.text },
        size === 'lg' && styles.textLg,
      ]}>
        {INVOICE_STATUS_LABELS[status] || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  textLg: {
    fontSize: 13,
  },
});

export default React.memo(StatusBadge);
