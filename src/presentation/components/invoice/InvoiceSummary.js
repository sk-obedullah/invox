/**
 * InvoiceSummary - Displays subtotal, tax, discount, and total with premium UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';

const SummaryRow = ({ label, value, bold, color, negative, secondary }) => {
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
          secondary && { fontSize: 13, color: colors.textTertiary }
        ]}
      >
        {negative && '− '}{value}
      </Text>
    </View>
  );
};

const InvoiceSummary = ({ totals, currency, showTax = true }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  
  const { subtotal, tax_amount, discount, total } = totals;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant + '50' }]}>
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal, currency)} />
      
      {showTax && tax_amount > 0 && (
        <SummaryRow label="Total Tax" value={formatCurrency(tax_amount, currency)} />
      )}
      
      {discount > 0 && (
        <SummaryRow
          label="Discount Applied"
          value={formatCurrency(discount, currency)}
          negative
          color={colors.error}
        />
      )}

      {/* Dashed Divider Visual */}
      <View style={styles.dashedContainer}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={[styles.dash, { backgroundColor: colors.border }]} />
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
        <View style={styles.totalValueContainer}>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(total, currency)}
          </Text>
          <Text style={[styles.currencyLabel, { color: colors.textTertiary }]}>{currency}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  dashedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  dash: {
    width: 6,
    height: 1,
    marginHorizontal: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValueContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  currencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
});

export default React.memo(InvoiceSummary);
