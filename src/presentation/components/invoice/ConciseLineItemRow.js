/**
 * ConciseLineItemRow - Professional, Minimalist Line Item Row
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';

const ConciseLineItemRow = ({
  item,
  currency = 'INR',
  showTax = true,
  onUpdateQty,
  onEdit,
  onRemove,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const qty = parseFloat(item.quantity) || 1;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const taxRate = showTax ? (parseFloat(item.tax_rate) || 0) : 0;
  const baseAmount = qty * unitPrice;
  const taxAmount = (baseAmount * taxRate) / 100;
  const totalAmount = baseAmount + taxAmount;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onEdit(item)}
      style={[
        styles.rowCard,
        { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
      ]}
    >
      {/* Top Line: Full Item Name & Total Price */}
      <View style={styles.topRow}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.name || 'Untitled Item'}
        </Text>
        <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
          {formatCurrency(totalAmount, currency)}
        </Text>
      </View>

      {/* Bottom Line: Rate breakdown & Stepper / Remove */}
      <View style={styles.bottomRow}>
        <View style={styles.breakdownWrap}>
          <Text style={[styles.breakdownText, { color: colors.textTertiary }]}>
            {qty} × {formatCurrency(unitPrice, currency)}
            {taxRate > 0 ? ` (+${taxRate}% tax)` : ''}
          </Text>
        </View>

        <View style={styles.controlsWrap}>
          {/* Stepper */}
          <View style={[styles.stepperBox, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQty(item.id, -1);
              }}
              style={styles.stepBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="minus" size={13} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.qtyNumber, { color: colors.textPrimary }]}>{qty}</Text>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQty(item.id, 1);
              }}
              style={styles.stepBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="plus" size={13} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Delete Icon */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
    letterSpacing: 0.2,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownWrap: {
    flex: 1,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: '500',
  },
  controlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 2,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyNumber: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 2,
  },
});

export default ConciseLineItemRow;
