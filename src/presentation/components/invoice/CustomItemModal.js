/**
 * CustomItemModal - Clean modal for adding or editing a custom line item
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';
import AppInput from '../common/AppInput';
import AppButton from '../common/AppButton';

const CustomItemModal = ({
  visible,
  itemToEdit = null,
  showTax = true,
  currency = 'INR',
  onClose,
  onSave,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const isEditing = !!itemToEdit;

  const [form, setForm] = useState({
    name: '',
    description: '',
    unit_price: '',
    quantity: '1',
    tax_rate: '0',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (itemToEdit) {
      setForm({
        name: itemToEdit.name || '',
        description: itemToEdit.description || '',
        unit_price: String(itemToEdit.unit_price || ''),
        quantity: String(itemToEdit.quantity || '1'),
        tax_rate: String(itemToEdit.tax_rate || '0'),
      });
    } else {
      setForm({
        name: '',
        description: '',
        unit_price: '',
        quantity: '1',
        tax_rate: '0',
      });
    }
    setErrors({});
  }, [itemToEdit, visible]);

  const updateField = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Item name is required' });
      return;
    }
    const price = parseFloat(form.unit_price);
    if (isNaN(price) || price < 0) {
      setErrors({ unit_price: 'Enter a valid price' });
      return;
    }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrors({ quantity: 'Quantity must be at least 1' });
      return;
    }

    const payload = {
      ...(itemToEdit || {}),
      id: itemToEdit?.id || Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      unit_price: form.unit_price,
      quantity: form.quantity,
      tax_rate: showTax ? (form.tax_rate || '0') : '0',
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                  <Icon name={isEditing ? 'pencil-outline' : 'plus'} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {isEditing ? 'Edit Item' : 'Add Custom Item'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <ScrollView
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AppInput
                label="Item / Service Name *"
                placeholder="What are you charging for?"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                leftIcon="tag-outline"
                error={errors.name}
                autoFocus={!isEditing}
              />

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <AppInput
                    label="Price per Unit *"
                    placeholder="0.00"
                    value={form.unit_price}
                    onChangeText={(v) => updateField('unit_price', v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    leftIcon="currency-inr"
                    error={errors.unit_price}
                  />
                </View>

                <View style={styles.col}>
                  <AppInput
                    label="Quantity *"
                    placeholder="1"
                    value={form.quantity}
                    onChangeText={(v) => updateField('quantity', v.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    leftIcon="numeric"
                    error={errors.quantity}
                  />
                </View>
              </View>

              {showTax && (
                <AppInput
                  label="Tax Rate (%)"
                  placeholder="e.g. 18"
                  value={form.tax_rate}
                  onChangeText={(v) => updateField('tax_rate', v.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  leftIcon="percent"
                />
              )}

              <AppInput
                label="Description (Optional)"
                placeholder="Add specification, notes, or model #..."
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
                multiline
                numberOfLines={2}
                leftIcon="text-box-outline"
              />
            </ScrollView>

            {/* Action Bar */}
            <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.borderLight }]}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <AppButton
                  title={isEditing ? 'Save Changes' : 'Add Item'}
                  onPress={handleSave}
                  icon={isEditing ? 'check' : 'plus'}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    ...elevation.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  formContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomItemModal;
