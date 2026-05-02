/**
 * InvoiceCard - Card component for invoice list items
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StatusBadge from './StatusBadge';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../utils/formatters';
import { getInitials, stringToColor } from '../../../utils/helpers';

const InvoiceCard = ({ invoice, onPress, index = 0 }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const handlePress = useCallback(() => {
    onPress?.(invoice);
  }, [invoice, onPress]);

  const avatarColor = stringToColor(invoice.customer_name);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400).springify()}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.card,
          elevation.sm,
          {
            backgroundColor: colors.card,
            borderColor: colors.borderLight,
          },
        ]}
      >
        {/* Top Row: Avatar + Invoice Info + Status */}
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {getInitials(invoice.customer_name || 'N/A')}
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={[styles.invoiceNumber, { color: colors.primary }]} numberOfLines={1}>
              {invoice.invoice_number}
            </Text>
            <Text style={[styles.customerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {invoice.customer_name || 'No Customer'}
            </Text>
          </View>

          <StatusBadge status={invoice.status} />
        </View>

        {/* Bottom Row: Date + Amount */}
        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
            <Icon name="calendar-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.dateText, { color: colors.textTertiary }]}>
              {formatDate(invoice.issue_date, 'DD MMM YYYY, HH:mm:ss')}
            </Text>
          </View>

          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            {formatCurrency(invoice.total, invoice.currency)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '400',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default React.memo(InvoiceCard);
