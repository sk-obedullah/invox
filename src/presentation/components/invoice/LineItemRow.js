/**
 * LineItemRow - Premium Editable row for invoice line items
 */

import React, { useCallback, memo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';
import { moderateScale, moderateFontScale, isSmallDevice } from '../../../utils/responsive';

const LineItemRow = ({
  item,
  index,
  currency,
  onUpdate,
  onRemove,
  showRemove = true,
  showTax = true,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const handleChange = useCallback(
    (field, value) => {
      const numericFields = ['quantity', 'unit_price', 'tax_rate'];
      const processedValue = numericFields.includes(field)
        ? value.replace(/[^0-9.]/g, '')
        : value;
      onUpdate(item.id, field, processedValue);
    },
    [item.id, onUpdate]
  );

  const lineAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  const taxAmount = (lineAmount * (parseFloat(item.tax_rate) || 0)) / 100;
  const totalAmount = lineAmount + taxAmount;

  // Helper to handle "0" values for user-friendly inputs
  const formatInputValue = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return '';
    return String(val);
  };

  return (
    <View style={[styles.container, elevation.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {/* Header Row: Index & Delete */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.indexBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={[styles.headerLabel, { color: colors.textPrimary }]}>Item Details</Text>
        </View>
        
        {showRemove && (
          <TouchableOpacity 
            onPress={() => onRemove(item.id)}
            style={[styles.removeBtn, { backgroundColor: colors.errorLight }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="trash-can-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Inputs */}
      <View style={styles.mainContent}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>Item Name</Text>
          <TextInput
            value={item.name}
            onChangeText={(v) => handleChange('name', v)}
            placeholder="What are you selling?"
            placeholderTextColor={colors.placeholder}
            style={[styles.nameInput, { color: colors.textPrimary, borderBottomColor: colors.borderLight }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>Description (Optional)</Text>
          <TextInput
            value={item.description}
            onChangeText={(v) => handleChange('description', v)}
            placeholder="Add details..."
            placeholderTextColor={colors.placeholder}
            multiline
            style={[styles.descInput, { color: colors.textSecondary, borderBottomColor: colors.borderLight }]}
          />
        </View>

        {/* Numbers Row */}
        <View style={styles.numbersRow}>
          <View style={[styles.numField, { flex: 0.8 }]}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Qty</Text>
            <TextInput
              value={formatInputValue(item.quantity)}
              onChangeText={(v) => handleChange('quantity', v)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              selectTextOnFocus
              style={[styles.numInput, { color: colors.textPrimary, backgroundColor: colors.surfaceVariant }]}
            />
          </View>

          <View style={[styles.numField, { flex: 1.5 }]}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>Price</Text>
            <TextInput
              value={formatInputValue(item.unit_price)}
              onChangeText={(v) => handleChange('unit_price', v)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              selectTextOnFocus
              style={[styles.numInput, { color: colors.textPrimary, backgroundColor: colors.surfaceVariant }]}
            />
          </View>

          {showTax && (
            <View style={[styles.numField, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Tax %</Text>
              <TextInput
                value={formatInputValue(item.tax_rate)}
                onChangeText={(v) => handleChange('tax_rate', v)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                selectTextOnFocus
                style={[styles.numInput, { color: colors.textPrimary, backgroundColor: colors.surfaceVariant }]}
              />
            </View>
          )}
        </View>
      </View>

      {/* Row Footer: Calculation Summary */}
      <View style={[styles.footerRow, { backgroundColor: colors.surfaceVariant + '50' }]}>
        <View style={styles.calcDetails}>
          {showTax && taxAmount > 0 && (
            <Text style={[styles.taxSummary, { color: colors.textSecondary }]}>
              + {formatCurrency(taxAmount, currency)} tax
            </Text>
          )}
        </View>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: colors.textTertiary }]}>Amount</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(totalAmount, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  descInput: {
    fontSize: 14,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  numField: {
    gap: 4,
  },
  numInput: {
    fontSize: 15,
    fontWeight: '700',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  calcDetails: {
    flex: 1,
  },
  taxSummary: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default memo(LineItemRow);
