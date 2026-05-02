/**
 * CreateInvoiceScreen - Full invoice creation/edit form
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';
import { moderateScale, moderateFontScale, isSmallDevice } from '../../utils/responsive';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import useItemStore from '../../store/useItemStore';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import LineItemRow from '../components/invoice/LineItemRow';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import { createEmptyInvoice, createEmptyLineItem } from '../../domain/models/Invoice';
import { calculateInvoiceTotals } from '../../utils/calculations';
import { formatDate, toISODate } from '../../utils/formatters';
import PdfService from '../../services/PdfService';
import ShareService from '../../services/ShareService';
import dayjs from 'dayjs';

const CreateInvoiceScreen = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const editId = route?.params?.invoiceId;
  const isEdit = !!editId;

  const { createInvoice, updateInvoice, fetchInvoiceById } = useInvoiceStore();
  const settings = useSettingsStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { items: predefinedItems, fetchItems } = useItemStore();
  const getNextInvoiceNumber = useSettingsStore((s) => s.getNextInvoiceNumber);

  const [form, setForm] = useState(() => createEmptyInvoice({
    default_tax_rate: settings.default_tax_rate,
    default_currency: settings.default_currency,
    notes: settings.default_notes,
    terms: settings.default_terms,
  }));
  const [lineItems, setLineItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Load data for edit mode
  useEffect(() => {
    if (isEdit) {
      (async () => {
        const invoice = await fetchInvoiceById(editId);
        if (invoice) {
          setForm(invoice);
          setLineItems(invoice.line_items || []);
        }
      })();
    } else {
      (async () => {
        const num = await getNextInvoiceNumber();
        setForm((f) => ({ ...f, invoice_number: num }));
      })();
    }
    fetchCustomers();
    fetchItems();
  }, [editId]);

  // Recalculate totals whenever line items or discount changes
  const totals = useMemo(() => {
    return calculateInvoiceTotals(lineItems, parseFloat(form.discount) || 0, form.discount_type);
  }, [lineItems, form.discount, form.discount_type]);

  const updateField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }, []);

  const handleLineItemUpdate = useCallback((index, updatedItem) => {
    setLineItems((items) => items.map((item, i) => i === index ? updatedItem : item));
  }, []);

  const handleAddLineItem = useCallback(() => {
    setLineItems((items) => [...items, createEmptyLineItem(items.length)]);
  }, []);

  const selectPredefinedItem = useCallback((item) => {
    setLineItems((items) => [
      ...items,
      {
        ...createEmptyLineItem(items.length),
        name: item.name,
        description: item.description || '',
        unit_price: item.unit_price ? item.unit_price.toString() : '0',
        tax_rate: item.tax_rate ? item.tax_rate.toString() : '0',
      }
    ]);
    setShowItemPicker(false);
  }, []);

  const handleRemoveLineItem = useCallback((index) => {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }, []);

  const selectCustomer = useCallback((customer) => {
    setForm((f) => ({
      ...f,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
      customer_address: [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', '),
    }));
    setShowCustomerPicker(false);
  }, []);

  const validate = (status) => {
    const errs = {};
    if (!form.invoice_number) errs.invoice_number = 'Required';
    if (!form.issue_date) errs.issue_date = 'Required';
    
    if (status !== 'draft') {
      const validItems = lineItems.filter((i) => i.name.trim());
      if (validItems.length === 0) errs.line_items = 'Add at least one item';
    }
    
    setErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      if (errs.line_items) {
        Alert.alert('Validation Error', errs.line_items);
      } else {
        Alert.alert('Validation Error', 'Please fill all required fields');
      }
      return false;
    }
    return true;
  };

  const handleSave = useCallback(async (status = 'draft') => {
    if (!validate(status)) return;
    setSaving(true);
    try {
      const calculatedItems = totals.line_items;
      const invoiceData = {
        ...form,
        status,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total: totals.total,
      };
      let newId = editId;
      if (isEdit) {
        await updateInvoice(editId, invoiceData, calculatedItems);
      } else {
        newId = await createInvoice(invoiceData, calculatedItems);
      }

      // If "Save & Send", generate PDF and share
      if (status === 'sent') {
        try {
          const fullInvoice = await fetchInvoiceById(newId);
          if (fullInvoice) {
            const pdfPath = await PdfService.generateInvoicePdf(fullInvoice, settings, settings.template);
            await ShareService.sharePdf(pdfPath, fullInvoice.invoice_number);
          }
        } catch (shareErr) {
          console.error('[CreateInvoice] Share failed:', shareErr);
          Alert.alert('Save Successful', 'Invoice saved, but PDF generation or sharing failed. You can try again from the invoice details.');
        }
      }

      // Small delay to ensure any native dialogs (Share) have finished their transition
      if (status === 'sent') {
        setTimeout(() => navigation.goBack(), 500);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  }, [form, lineItems, totals, isEdit, editId]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
        >
          {/* Invoice Details */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <AppCard style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Invoice Details</Text>
              <AppInput label="Invoice Number" value={form.invoice_number} onChangeText={(v) => updateField('invoice_number', v)} leftIcon="pound" error={errors.invoice_number} required />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <AppInput label="Issue Date & Time" value={form.issue_date} onChangeText={(v) => updateField('issue_date', v)} leftIcon="calendar" placeholder="YYYY-MM-DD HH:mm:ss" required error={errors.issue_date} />
                </View>
                <View style={styles.halfField}>
                  <AppInput label="Due Date" value={form.due_date || ''} onChangeText={(v) => updateField('due_date', v)} leftIcon="calendar-clock" placeholder="YYYY-MM-DD" />
                </View>
              </View>
            </AppCard>
          </Animated.View>

          {/* Customer */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer</Text>
                <TouchableOpacity onPress={() => setShowCustomerPicker(!showCustomerPicker)}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {showCustomerPicker ? 'Close' : 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showCustomerPicker && (
                <View style={[styles.customerList, { borderColor: colors.border }]}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                    {customers.map((c) => (
                      <TouchableOpacity key={c.id} onPress={() => selectCustomer(c)} style={[styles.customerItem, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.customerItemName, { color: colors.textPrimary }]}>{c.name}</Text>
                        <Text style={[styles.customerItemSub, { color: colors.textTertiary }]}>{c.email || c.phone || ''}</Text>
                      </TouchableOpacity>
                    ))}
                    {customers.length === 0 && <Text style={[styles.noCustomers, { color: colors.textTertiary }]}>No customers saved</Text>}
                  </ScrollView>
                </View>
              )}

              <AppInput label="Customer Name" value={form.customer_name} onChangeText={(v) => updateField('customer_name', v)} leftIcon="account" />
              <AppInput label="Email" value={form.customer_email} onChangeText={(v) => updateField('customer_email', v)} leftIcon="email-outline" keyboardType="email-address" />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <AppInput label="Phone" value={form.customer_phone} onChangeText={(v) => updateField('customer_phone', v)} leftIcon="phone-outline" keyboardType="phone-pad" />
                </View>
              </View>
              <AppInput label="Address" value={form.customer_address} onChangeText={(v) => updateField('customer_address', v)} leftIcon="map-marker-outline" multiline numberOfLines={2} />
            </AppCard>
          </Animated.View>

          {/* Line Items */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
                <TouchableOpacity onPress={() => setShowItemPicker(!showItemPicker)}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {showItemPicker ? 'Close Picker' : 'Select from List'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showItemPicker && (
                <View style={[styles.customerList, { borderColor: colors.border }]}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                    {predefinedItems.map((pItem) => (
                      <TouchableOpacity key={pItem.id} onPress={() => selectPredefinedItem(pItem)} style={[styles.customerItem, { borderBottomColor: colors.divider }]}>
                        <Text style={[styles.customerItemName, { color: colors.textPrimary }]}>{pItem.name}</Text>
                        <Text style={[styles.customerItemSub, { color: colors.textTertiary }]}>{pItem.unit_price} (Tax: {pItem.tax_rate}%)</Text>
                      </TouchableOpacity>
                    ))}
                    {predefinedItems.length === 0 && <Text style={[styles.noCustomers, { color: colors.textTertiary }]}>No predefined items saved</Text>}
                  </ScrollView>
                </View>
              )}

              {errors.line_items && <Text style={[styles.errorText, { color: colors.error }]}>{errors.line_items}</Text>}
              {lineItems.map((item, index) => (
                <LineItemRow key={index} item={item} index={index} currency={form.currency} onUpdate={handleLineItemUpdate} onRemove={handleRemoveLineItem} showRemove={true} />
              ))}
              <AppButton title="Add Custom Item" icon="plus" variant="secondary" onPress={handleAddLineItem} fullWidth />
            </AppCard>
          </Animated.View>

          {/* Discount */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <AppCard style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Discount</Text>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <AppInput label="Amount" value={String(form.discount || '')} onChangeText={(v) => updateField('discount', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" leftIcon="tag-outline" />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={styles.typeToggle}>
                    {['fixed', 'percentage'].map((type) => (
                      <TouchableOpacity key={type} onPress={() => updateField('discount_type', type)}
                        style={[styles.typeBtn, { backgroundColor: form.discount_type === type ? colors.primary : colors.surfaceVariant, borderColor: form.discount_type === type ? colors.primary : colors.border }]}>
                        <Text style={{ color: form.discount_type === type ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                          {type === 'fixed' ? '₹ Fixed' : '% Percent'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </AppCard>
          </Animated.View>

          {/* Summary */}
          <InvoiceSummary subtotal={totals.subtotal} taxAmount={totals.tax_amount} discount={totals.discount} total={totals.total} currency={form.currency} />

          {/* Notes & Terms */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <AppCard style={styles.section}>
              <AppInput label="Notes" value={form.notes} onChangeText={(v) => updateField('notes', v)} multiline numberOfLines={3} placeholder="Any additional notes..." />
              <AppInput label="Terms & Conditions" value={form.terms} onChangeText={(v) => updateField('terms', v)} multiline numberOfLines={3} placeholder="Payment terms..." />
            </AppCard>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <AppButton title="Save Draft" variant="outline" icon="content-save-outline" onPress={() => handleSave('draft')} loading={saving} style={styles.actionBtn} />
            <AppButton title="Save & Send" icon="send" onPress={() => handleSave('sent')} loading={saving} style={styles.actionBtn} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: moderateFontScale(18), fontWeight: '600' },
  scrollContent: { padding: moderateScale(spacing.base) },
  section: { marginBottom: spacing.base },
  sectionTitle: { fontSize: moderateFontScale(16), fontWeight: '600', marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: isSmallDevice ? 'wrap' : 'nowrap', gap: moderateScale(spacing.md) },
  halfField: { flex: 1, minWidth: isSmallDevice ? '100%' : 'auto' },
  fieldLabel: { fontSize: moderateFontScale(13), fontWeight: '500', marginBottom: spacing.xs },
  typeToggle: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.sm, borderWidth: 1 },
  linkText: { fontSize: moderateFontScale(14), fontWeight: '500' },
  customerList: { borderWidth: 1, borderRadius: borderRadius.md, marginBottom: spacing.md, maxHeight: 180 },
  customerItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  customerItemName: { fontSize: moderateFontScale(14), fontWeight: '500' },
  customerItemSub: { fontSize: moderateFontScale(12) },
  noCustomers: { padding: spacing.base, textAlign: 'center', fontSize: 13 },
  errorText: { fontSize: moderateFontScale(12), marginBottom: spacing.sm },
  actionButtons: { flexDirection: 'row', gap: moderateScale(spacing.md), marginTop: spacing.lg, flexWrap: isSmallDevice ? 'wrap' : 'nowrap' },
  actionBtn: { flex: 1, minWidth: isSmallDevice ? '100%' : 'auto' },
});

export default CreateInvoiceScreen;
