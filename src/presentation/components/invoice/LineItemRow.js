/**
 * LineItemRow - Editable row for invoice line items
 */

import React, { useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';
import { moderateScale, moderateFontScale, isSmallDevice } from '../../../utils/responsive';

const LineItemRow = ({
  item,
  index,
  currency,
  onUpdate,
  onRemove,
  showRemove = true,
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  const handleChange = useCallback(
    (field, value) => {
      const numericFields = ['quantity', 'unit_price', 'tax_rate'];
      const processedValue = numericFields.includes(field)
        ? value.replace(/[^0-9.]/g, '')
        : value;
      onUpdate(index, { ...item, [field]: processedValue });
    },
    [index, item, onUpdate]
  );

  const lineAmount =
    (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  const taxAmount = (lineAmount * (parseFloat(item.tax_rate) || 0)) / 100;
  const totalAmount = lineAmount + taxAmount;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {/* Header: Item number + Remove */}
      <View style={styles.headerRow}>
        <View style={[styles.itemBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.itemBadgeText, { color: colors.primary }]}>#{index + 1}</Text>
        </View>
        {showRemove && (
          <TouchableOpacity
            onPress={() => onRemove(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.removeBtn, { backgroundColor: colors.errorLight }]}
          >
            <Icon name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Item Name */}
      <TextInput
        value={item.name}
        onChangeText={(v) => handleChange('name', v)}
        placeholder="Item name *"
        placeholderTextColor={colors.placeholder}
        style={[styles.nameInput, { color: colors.textPrimary, borderColor: colors.border }]}
      />

      {/* Description */}
      <TextInput
        value={item.description}
        onChangeText={(v) => handleChange('description', v)}
        placeholder="Description (optional)"
        placeholderTextColor={colors.placeholder}
        style={[styles.descInput, { color: colors.textSecondary, borderColor: colors.border }]}
        multiline
      />

      {/* Quantity, Price, Tax row */}
      <View style={styles.fieldsRow}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Qty</Text>
          <TextInput
            value={String(item.quantity)}
            onChangeText={(v) => handleChange('quantity', v)}
            keyboardType="decimal-pad"
            style={[styles.fieldInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </View>

        <View style={[styles.fieldGroup, { flex: 1.5 }]}>
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Price</Text>
          <TextInput
            value={String(item.unit_price)}
            onChangeText={(v) => handleChange('unit_price', v)}
            keyboardType="decimal-pad"
            style={[styles.fieldInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>Tax %</Text>
          <TextInput
            value={String(item.tax_rate)}
            onChangeText={(v) => handleChange('tax_rate', v)}
            keyboardType="decimal-pad"
            style={[styles.fieldInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </View>
      </View>

      {/* Amount display */}
      <View style={[styles.amountRow, { borderTopColor: colors.divider }]}>
        {taxAmount > 0 && (
          <Text style={[styles.taxText, { color: colors.textTertiary }]}>
            Tax: {formatCurrency(taxAmount, currency)}
          </Text>
        )}
        <Text style={[styles.amountText, { color: colors.primary }]}>
          {formatCurrency(totalAmount, currency)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: moderateScale(spacing.base),
    marginBottom: moderateScale(spacing.md),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(spacing.md),
  },
  itemBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  itemBadgeText: {
    fontSize: moderateFontScale(12),
    fontWeight: '600',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: moderateFontScale(15),
    fontWeight: '500',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: moderateScale(spacing.sm),
  },
  descInput: {
    fontSize: moderateFontScale(13),
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: moderateScale(spacing.md),
  },
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: isSmallDevice ? 'wrap' : 'nowrap',
    gap: moderateScale(spacing.md),
  },
  fieldGroup: {
    flex: 1,
    minWidth: isSmallDevice ? '40%' : 'auto',
  },
  fieldLabel: {
    fontSize: moderateFontScale(11),
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: moderateFontScale(15),
    fontWeight: '500',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: moderateScale(spacing.sm),
    paddingVertical: 8,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(spacing.md),
    paddingTop: moderateScale(spacing.md),
    borderTopWidth: 1,
  },
  taxText: {
    fontSize: moderateFontScale(12),
  },
  amountText: {
    fontSize: moderateFontScale(17),
    fontWeight: '700',
    marginLeft: 'auto',
  },
});

export default React.memo(LineItemRow);
