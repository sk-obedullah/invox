/**
 * InvoiceSummary - Displays subtotal, tax, discount, and total
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';

const SummaryRow = ({ label, value, bold, color, negative }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { color: color || colors.textPrimary },
          bold && styles.valueBold,
        ]}
      >
        {negative && '−'}{value}
      </Text>
    </View>
  );
};

const InvoiceSummary = ({ subtotal, taxAmount, discount, total, currency }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal, currency)} />
      <SummaryRow label="Tax" value={formatCurrency(taxAmount, currency)} />
      {discount > 0 && (
        <SummaryRow
          label="Discount"
          value={formatCurrency(discount, currency)}
          negative
          color={colors.error}
        />
      )}
      <View style={[styles.divider, { borderTopColor: colors.border }]} />
      <SummaryRow
        label="Total"
        value={formatCurrency(total, currency)}
        bold
        color={colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 6,
  },
});

export default React.memo(InvoiceSummary);
