/**
 * CustomerFormScreen - Add/Edit customer
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing } from '../../theme/spacing';
import { useCustomerStore } from '../../store/useCustomerStore';
import CustomerRepository from '../../data/repositories/CustomerRepository';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import { createEmptyCustomer } from '../../domain/models/Customer';

const CustomerFormScreen = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const editId = route?.params?.customerId;
  const isEdit = !!editId;
  const { createCustomer, updateCustomer } = useCustomerStore();
  const [form, setForm] = useState(createEmptyCustomer());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      CustomerRepository.getById(editId).then((c) => { if (c) setForm(c); });
    }
  }, [editId]);

  const updateField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }, []);

  const handleSave = useCallback(async () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (isEdit) await updateCustomer(editId, form);
      else await createCustomer(form);
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  }, [form, isEdit, editId]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Customer' : 'New Customer'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppCard style={styles.section}>
          <AppInput label="Name" value={form.name} onChangeText={(v) => updateField('name', v)} leftIcon="account" required error={errors.name} />
          <AppInput label="Email" value={form.email} onChangeText={(v) => updateField('email', v)} leftIcon="email-outline" keyboardType="email-address" error={errors.email} />
          <AppInput label="Phone" value={form.phone} onChangeText={(v) => updateField('phone', v)} leftIcon="phone-outline" keyboardType="phone-pad" />
          <AppInput label="GSTIN" value={form.gstin} onChangeText={(v) => updateField('gstin', v)} leftIcon="card-account-details-outline" />
        </AppCard>
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address</Text>
          <AppInput label="Street" value={form.address} onChangeText={(v) => updateField('address', v)} leftIcon="map-marker-outline" multiline />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><AppInput label="City" value={form.city} onChangeText={(v) => updateField('city', v)} /></View>
            <View style={{ flex: 1 }}><AppInput label="State" value={form.state} onChangeText={(v) => updateField('state', v)} /></View>
          </View>
          <AppInput label="ZIP" value={form.zip_code} onChangeText={(v) => updateField('zip_code', v)} keyboardType="number-pad" />
        </AppCard>
        <AppCard style={styles.section}>
          <AppInput label="Notes" value={form.notes} onChangeText={(v) => updateField('notes', v)} multiline numberOfLines={3} placeholder="Internal notes..." />
        </AppCard>
        <AppButton title={isEdit ? 'Update' : 'Save Customer'} icon="check" onPress={handleSave} loading={saving} fullWidth />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: spacing.base },
  section: { marginBottom: spacing.base },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});

export default CustomerFormScreen;
