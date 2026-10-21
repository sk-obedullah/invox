/**
 * CreateInvoiceScreen - Multi-step form to create or edit invoices
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, FlatList, Modal
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import useItemStore from '../../store/useItemStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { calculateInvoiceTotals } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import LineItemRow from '../components/invoice/LineItemRow';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import PdfService from '../../services/PdfService';
import ShareService from '../../services/ShareService';
import SearchBar from '../components/common/SearchBar';

// Premium Selection Modal Component - Memoized for performance
const SelectionModal = memo(({ visible, title, data, onSelect, onClose, colors, search, onSearchChange, placeholder }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Icon name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.modalSearch}>
          <SearchBar value={search} onChangeText={onSearchChange} placeholder={placeholder} />
        </View>

        <FlatList 
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.modalList}
          renderItem={({ item }) => {
            const isOutOfStock = title === 'Select Item' && item.stock_quantity <= 0;
            return (
              <TouchableOpacity 
                onPress={() => !isOutOfStock && onSelect(item)} 
                activeOpacity={isOutOfStock ? 1 : 0.7}
                style={[
                  styles.modalItem, 
                  { borderBottomColor: colors.divider },
                  isOutOfStock && { opacity: 0.5 }
                ]}
              >
                <View style={styles.pickerItemInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.customerItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    {isOutOfStock && (
                      <View style={[styles.outOfStockBadge, { backgroundColor: colors.errorLight }]}>
                        <Text style={[styles.outOfStockText, { color: colors.error }]}>OUT OF STOCK</Text>
                      </View>
                    )}
                    {item.isRecent && !isOutOfStock && (
                      <View style={[styles.recentBadge, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="history" size={10} color={colors.primary} />
                        <Text style={[styles.recentText, { color: colors.primary }]}>RECENT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={[styles.customerItemSub, { color: colors.textTertiary }]}>
                      {item.email || item.phone || `${formatCurrency(item.unit_price, 'INR')}`}
                    </Text>
                    {title === 'Select Item' && (
                      <Text style={[styles.stockValue, { color: item.stock_quantity <= (item.min_stock_level || 0) ? colors.error : colors.textSecondary }]}>
                        Stock: {item.stock_quantity || 0}
                      </Text>
                    )}
                  </View>
                </View>
                {!isOutOfStock && <Icon name="chevron-right" size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.modalEmpty}>
              <Icon name="magnify-close" size={48} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, marginTop: 12 }}>No matches found</Text>
            </View>
          }
          // Optimization for long picker lists
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>
    </Modal>
  );
});

const CreateInvoiceScreen = ({ navigation, route }) => {
  const { invoiceId } = route.params || {};
  const isEdit = !!invoiceId;
  const editId = invoiceId;

  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  
  const { createInvoice, updateInvoice, fetchInvoiceById } = useInvoiceStore();
  const { customers, recentCustomers, fetchCustomers, fetchRecentCustomers } = useCustomerStore();
  const { items: predefinedItems, recentItems, fetchItems, fetchRecentItems } = useItemStore();

  const [saving, setSaving] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [showAdvanceDetails, setShowAdvanceDetails] = useState(false);

  const [form, setForm] = useState({
    invoice_number: '',
    customer_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    status: 'draft',
    issue_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    due_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    discount: '0',
    discount_type: 'fixed',
    currency: settings.default_currency || 'INR',
    notes: settings.default_notes || '',
    terms: settings.default_terms || '',
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), name: '', description: '', quantity: '1', unit_price: '0', tax_rate: '0', mrp_price: '0', purchase_price: '0' }
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
    fetchRecentCustomers();
    fetchItems();
    fetchRecentItems();
    if (isEdit) {
      loadInvoice();
    } else {
      generateInvoiceNumber();
    }
  }, []);

  const loadInvoice = async () => {
    try {
      const inv = await fetchInvoiceById(editId);
      if (inv) {
        setForm({
          ...inv,
          discount: String(inv.discount || 0),
        });
        setLineItems(inv.line_items.map(li => ({
          ...li,
          quantity: String(li.quantity),
          unit_price: String(li.unit_price),
          tax_rate: String(li.tax_rate),
          mrp_price: String(li.mrp_price || 0),
          purchase_price: String(li.purchase_price || 0),
        })));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load invoice details');
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const nextNo = await settings.getNextInvoiceNumber();
      updateField('invoice_number', nextNo);
    } catch (err) {
      console.warn('Failed to auto-generate invoice number');
    }
  };

  const totals = useMemo(() => {
    return calculateInvoiceTotals(lineItems, parseFloat(form.discount) || 0, form.discount_type, settings.enable_tax);
  }, [lineItems, form.discount, form.discount_type, settings.enable_tax]);

  const filteredCustomers = useMemo(() => {
    const lower = customerSearch.toLowerCase();
    const all = !customerSearch 
      ? [...recentCustomers.map(c => ({ ...c, isRecent: true })), ...customers.filter(c => !recentCustomers.some(rc => rc.id === c.id))]
      : customers.filter(c => c.name.toLowerCase().includes(lower) || (c.email && c.email.toLowerCase().includes(lower)));
    return all;
  }, [customers, recentCustomers, customerSearch]);

  const filteredItems = useMemo(() => {
    const lower = itemSearch.toLowerCase();
    const all = !itemSearch
      ? [...recentItems.map(i => ({ ...i, isRecent: true })), ...predefinedItems.filter(i => !recentItems.some(ri => ri.id === i.id))]
      : predefinedItems.filter(i => i.name.toLowerCase().includes(lower));
    return all;
  }, [predefinedItems, recentItems, itemSearch]);

  const updateField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      if (e[field]) return { ...e, [field]: null };
      return e;
    });
  }, []);

  const selectCustomer = useCallback((customer) => {
    setForm(f => ({
      ...f,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
      customer_address: customer.address || '',
    }));
    setShowCustomerPicker(false);
    setCustomerSearch('');
  }, []);

  const selectPredefinedItem = useCallback((pItem) => {
    const newItem = {
      id: Date.now(),
      item_id: pItem.id, // CRITICAL: Link to inventory for stock deduction
      name: pItem.name,
      description: pItem.description || '',
      quantity: '1',
      unit_price: String(pItem.unit_price || 0),
      tax_rate: String(pItem.tax_rate || 0),
      mrp_price: String(pItem.mrp_price || 0),
      purchase_price: String(pItem.purchase_price || 0),
      max_stock: pItem.stock_quantity, // For validation
    };
    
    setLineItems(prev => {
      const last = prev[prev.length - 1];
      if (prev.length === 1 && !last.name && last.unit_price === '0') return [newItem];
      return [...prev, newItem];
    });
    setShowItemPicker(false);
    setItemSearch('');
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, { id: Date.now(), name: '', description: '', quantity: '1', unit_price: '0', tax_rate: '0', mrp_price: '0', purchase_price: '0' }]);
  }, []);

  const updateLineItem = useCallback((id, field, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        // Validate quantity against available stock
        if (field === 'quantity' && item.max_stock !== undefined) {
          const requestedQty = parseFloat(value) || 0;
          if (requestedQty > item.max_stock) {
            Alert.alert('Low Stock', `Only ${item.max_stock} units available in inventory.`);
            return { ...item, [field]: String(item.max_stock) };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  }, []);

  const removeLineItem = useCallback((id) => {
    setLineItems(prev => {
      if (prev.length > 1) return prev.filter(item => item.id !== id);
      return [{ id: Date.now(), name: '', description: '', quantity: '1', unit_price: '0', tax_rate: '0', mrp_price: '0', purchase_price: '0' }];
    });
  }, []);

  const validate = (status) => {
    const newErrors = {};
    if (!form.invoice_number) newErrors.invoice_number = 'Required';
    if (!form.issue_date) newErrors.issue_date = 'Required';
    if (!form.customer_name && status !== 'draft') newErrors.customer_name = 'Required';
    
    const hasValidItems = lineItems.some(li => li.name && parseFloat(li.quantity) > 0);
    if (!hasValidItems) newErrors.line_items = 'Add at least one item';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async (status = 'draft') => {
    if (!validate(status)) return;
    setSaving(true);
    try {
      const calculatedItems = totals.line_items.map((item, idx) => ({
        ...item,
        mrp_price: parseFloat(lineItems[idx].mrp_price) || 0,
        purchase_price: parseFloat(lineItems[idx].purchase_price) || 0,
      }));
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

      if (status === 'sent') {
        try {
          const fullInvoice = await fetchInvoiceById(newId);
          if (fullInvoice) {
            const pdfPath = await PdfService.generateInvoicePdf(fullInvoice, settings);
            await ShareService.sharePdf(pdfPath, fullInvoice.invoice_number);
          }
        } catch (pdfErr) {
          console.error('PDF/Share Error:', pdfErr);
        }
      }

      setTimeout(() => navigation.goBack(), 300);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  }, [form, lineItems, totals, isEdit, editId, settings, navigation, createInvoice, updateInvoice, fetchInvoiceById]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        >
          {/* Condensed Invoice Info Header */}
          <View style={[styles.compactInfoRow, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.infoBadge}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>INV NO</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{form.invoice_number}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>DATE</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {dayjs(form.issue_date).format('DD MMM, YYYY')}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowAdvanceDetails(!showAdvanceDetails)}
              style={[styles.editInfoBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Icon name={showAdvanceDetails ? "chevron-up" : "cog-outline"} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showAdvanceDetails && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <AppCard style={styles.advanceCard}>
                <AppInput label="Manual Invoice Number" value={form.invoice_number} onChangeText={(v) => updateField('invoice_number', v)} leftIcon="pound" />
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <AppInput label="Issue Date" value={form.issue_date} onChangeText={(v) => updateField('issue_date', v)} leftIcon="calendar" />
                  </View>
                  <View style={styles.halfField}>
                    <AppInput label="Due Date" value={form.due_date || ''} onChangeText={(v) => updateField('due_date', v)} leftIcon="calendar-clock" />
                  </View>
                </View>
              </AppCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="account-tie" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCustomerPicker(true)}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Select Existing</Text>
                </TouchableOpacity>
              </View>

              <AppInput label="Customer Name" value={form.customer_name} onChangeText={(v) => updateField('customer_name', v)} leftIcon="account" error={errors.customer_name} />
              <AppInput label="Email" value={form.customer_email} onChangeText={(v) => updateField('customer_email', v)} leftIcon="email-outline" keyboardType="email-address" />
              <AppInput label="Address" value={form.customer_address} onChangeText={(v) => updateField('customer_address', v)} leftIcon="map-marker-outline" multiline numberOfLines={2} />
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="format-list-bulleted" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
                </View>
                <TouchableOpacity onPress={() => setShowItemPicker(true)}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Inventory</Text>
                </TouchableOpacity>
              </View>

              {lineItems.map((item, index) => (
                <LineItemRow 
                  key={item.id} item={item} index={index} 
                  onUpdate={updateLineItem} onRemove={removeLineItem}
                  showTax={settings.enable_tax}
                  currency={form.currency}
                />
              ))}

              <TouchableOpacity onPress={addLineItem} style={[styles.addItemBtn, { borderColor: colors.primary }]}>
                <Icon name="plus" size={20} color={colors.primary} />
                <Text style={[styles.addItemText, { color: colors.primary }]}>Add Line Item</Text>
              </TouchableOpacity>
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <AppCard style={[styles.section, styles.summarySection]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="calculator" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Final Summary</Text>
                </View>
              </View>
              
              <View style={[styles.discountBar, { backgroundColor: colors.surfaceVariant, marginBottom: spacing.md }]}>
                <Icon name="tag-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppInput 
                    placeholder="Add Discount" 
                    value={form.discount} 
                    onChangeText={(v) => updateField('discount', v)} 
                    keyboardType="numeric" 
                    style={{ marginBottom: 0 }}
                    inputStyle={{ paddingVertical: 8, fontSize: 14 }}
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => updateField('discount_type', form.discount_type === 'percentage' ? 'fixed' : 'percentage')}
                  style={[styles.typeToggleCompact, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.typeToggleTextCompact}>{form.discount_type === 'percentage' ? '%' : 'FIX'}</Text>
                </TouchableOpacity>
              </View>

              <InvoiceSummary totals={totals} currency={form.currency} showTax={settings.enable_tax} />
            </AppCard>

            <AppCard style={[styles.section, styles.notesSection]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="file-document-edit-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Professional Documentation</Text>
                </View>
              </View>
              
              <View style={[styles.noteBox, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.noteHeader}>
                  <Icon name="message-text-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.noteLabel, { color: colors.textTertiary }]}>PRIVATE NOTES</Text>
                </View>
                <AppInput 
                  value={form.notes} 
                  onChangeText={(v) => updateField('notes', v)} 
                  multiline 
                  placeholder="e.g. Project milestone reached, pending final review." 
                  style={styles.noMarginInput}
                  inputStyle={styles.documentInput}
                />
              </View>

              <View style={[styles.noteBox, { marginTop: spacing.md, backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.noteHeader}>
                  <Icon name="shield-check-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.noteLabel, { color: colors.textTertiary }]}>TERMS & CONDITIONS</Text>
                </View>
                <AppInput 
                  value={form.terms} 
                  onChangeText={(v) => updateField('terms', v)} 
                  multiline 
                  placeholder="e.g. Payment is due within 15 days. 2% late fee apply." 
                  style={styles.noMarginInput}
                  inputStyle={styles.documentInput}
                />
              </View>
            </AppCard>
          </Animated.View>

          <View style={styles.footer}>
            <AppButton 
              title="Save Draft" 
              icon="content-save-outline"
              variant="outline" 
              onPress={() => handleSave('draft')} 
              loading={saving} 
              style={{ flex: 1 }} 
            />
            <AppButton 
              title={isEdit ? "Update & Share PDF" : "Save & Share PDF"} 
              icon="share-variant-outline"
              onPress={() => handleSave('sent')} 
              loading={saving} 
              style={{ flex: 1.5, marginLeft: spacing.sm }} 
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Selection Modals */}
      <SelectionModal 
        visible={showCustomerPicker}
        title="Select Customer"
        placeholder="Search customers..."
        data={filteredCustomers}
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        onSelect={selectCustomer}
        onClose={() => setShowCustomerPicker(false)}
        colors={colors}
      />

      <SelectionModal 
        visible={showItemPicker}
        title="Select Item"
        placeholder="Search inventory..."
        data={filteredItems}
        search={itemSearch}
        onSearchChange={setItemSearch}
        onSelect={selectPredefinedItem}
        onClose={() => setShowItemPicker(false)}
        colors={colors}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: spacing.base, paddingBottom: spacing.xl },
  
  // Compact Header Styles
  compactInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingBottom: spacing.md, 
    marginBottom: spacing.base,
    borderBottomWidth: 1,
  },
  infoBadge: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700' },
  editInfoBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  advanceCard: { padding: spacing.md, marginBottom: spacing.lg, borderRadius: borderRadius.lg },

  section: { padding: spacing.md, marginBottom: spacing.lg, borderRadius: borderRadius.lg },
  summarySection: { ...elevation.sm },
  
  // Professional Notes Section
  notesSection: { 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)',
  },
  noteBox: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  noteLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noMarginInput: { marginBottom: 0 },
  documentInput: { 
    fontSize: 14, 
    lineHeight: 20, 
    minHeight: 60,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  linkText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  
  // Discount Bar
  discountBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: borderRadius.md, 
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  typeToggleCompact: { 
    paddingHorizontal: 12, 
    height: 36, 
    marginRight: 6, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  typeToggleTextCompact: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1 },
  modalCloseBtn: { width: 40, height: 40, justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSearch: { padding: spacing.base },
  modalList: { paddingBottom: 40 },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1 },
  modalEmpty: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  
  pickerItemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customerItemName: { fontSize: 16, fontWeight: '700' },
  outOfStockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  outOfStockText: { fontSize: 8, fontWeight: '900' },
  recentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recentText: { fontSize: 8, fontWeight: '800' },
  itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  customerItemSub: { fontSize: 13 },
  stockValue: { fontSize: 11, fontWeight: '600' },
  
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: borderRadius.md, borderWidth: 1, borderStyle: 'dashed', marginTop: spacing.md },
  addItemText: { marginLeft: 8, fontWeight: '600' },
  footer: { flexDirection: 'row', marginTop: spacing.base },
  // Revision Modal
  revisionModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.xl },
  revisionModalContent: { borderRadius: borderRadius.xl, padding: spacing.xl, ...elevation.lg },
  revisionModalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  revisionModalTitle: { fontSize: 20, fontWeight: '800' },
  revisionModalSub: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  revisionModalFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  revCancelBtn: { paddingHorizontal: spacing.lg },
  revCancelText: { fontSize: 14, fontWeight: '700' },
});

export default CreateInvoiceScreen;
