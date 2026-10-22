/**
 * NewCustomerModal - Quick customer creation modal for invoice flow
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';
import { useCustomerStore } from '../../../store/useCustomerStore';
import AppInput from '../common/AppInput';
import AppButton from '../common/AppButton';

const NewCustomerModal = ({ visible, onClose, onCustomerCreated, colors }) => {
  const insets = useSafeAreaInsets();
  const createCustomer = useCustomerStore((s) => s.createCustomer);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Customer name is required' });
      return;
    }

    setSaving(true);
    try {
      const customerData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        gstin: form.gstin.trim(),
      };

      const newId = await createCustomer(customerData);
      const createdObj = { id: newId, ...customerData };
      
      // Reset form
      setForm({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
      setErrors({});
      
      onCustomerCreated(createdObj);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
          pointerEvents="box-none"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="account-plus" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Customer</Text>
              </View>
              <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <ScrollView
              contentContainerStyle={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <AppInput
                label="Customer / Business Name *"
                placeholder="e.g. Reliance Digital Ltd or John Doe"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                leftIcon="account"
                error={errors.name}
                autoFocus
              />

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <AppInput
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v)}
                    leftIcon="phone-outline"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.col}>
                  <AppInput
                    label="Email Address"
                    placeholder="name@company.com"
                    value={form.email}
                    onChangeText={(v) => updateField('email', v)}
                    leftIcon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <AppInput
                label="Billing Address"
                placeholder="Street address, building, suite..."
                value={form.address}
                onChangeText={(v) => updateField('address', v)}
                leftIcon="map-marker-outline"
                multiline
                numberOfLines={2}
              />

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <AppInput
                    label="City"
                    placeholder="e.g. Hyderabad"
                    value={form.city}
                    onChangeText={(v) => updateField('city', v)}
                  />
                </View>
                <View style={styles.col}>
                  <AppInput
                    label="State"
                    placeholder="e.g. Telangana"
                    value={form.state}
                    onChangeText={(v) => updateField('state', v)}
                  />
                </View>
              </View>

              <AppInput
                label="GSTIN / Tax ID"
                placeholder="e.g. 36AABCR1234F1Z5"
                value={form.gstin}
                onChangeText={(v) => updateField('gstin', v)}
                autoCapitalize="characters"
                leftIcon="card-account-details-outline"
              />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomBar, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.cancelBtn, { borderColor: colors.borderLight }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Save & Select"
                  onPress={handleSave}
                  loading={saving}
                  icon="check"
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalSheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  formScroll: {
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
  bottomBar: {
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
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NewCustomerModal;
