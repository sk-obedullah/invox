/**
 * CreateInvoiceScreen - Professional, Minimalist Invoice Creation Flow
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, FlatList, Modal, TextInput, Keyboard
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
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import PdfService from '../../services/PdfService';
import ShareService from '../../services/ShareService';
import SearchBar from '../components/common/SearchBar';

// Modular Invoice Components
import NewCustomerModal from '../components/invoice/NewCustomerModal';
import CustomerDetailModal from '../components/invoice/CustomerDetailModal';
import InventoryMultiPickerModal from '../components/invoice/InventoryMultiPickerModal';
import CustomItemModal from '../components/invoice/CustomItemModal';
import ConciseLineItemRow from '../components/invoice/ConciseLineItemRow';

// Customer Selection Modal (for existing customers)
const CustomerPickerModal = memo(({ visible, data, onSelect, onClose, colors, search, onSearchChange, onAddNew }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Icon name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Customer</Text>
          <TouchableOpacity onPress={onAddNew} style={styles.headerActionBtn}>
            <Icon name="account-plus-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalSearch}>
          <SearchBar value={search} onChangeText={onSearchChange} placeholder="Search customers by name, phone or email..." />
        </View>

        <FlatList 
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.modalList}
          renderItem={({ item }) => {
            const initials = (item.name || 'C')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(w => w[0].toUpperCase())
              .join('');

            return (
              <TouchableOpacity 
                onPress={() => onSelect(item)} 
                activeOpacity={0.7}
                style={[styles.modalItem, { borderBottomColor: colors.divider }]}
              >
                <View style={[styles.customerAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                </View>

                <View style={styles.pickerItemInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.customerItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    {item.isRecent && (
                      <View style={[styles.recentBadge, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="history" size={10} color={colors.primary} />
                        <Text style={[styles.recentText, { color: colors.primary }]}>RECENT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={[styles.customerItemSub, { color: colors.textTertiary }]} numberOfLines={1}>
                      {item.phone || item.email || item.city || 'No contact details'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.modalEmpty}>
              <Icon name="account-search-outline" size={48} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, marginTop: 12, fontSize: 14 }}>No matching customers</Text>
              <TouchableOpacity 
                onPress={onAddNew}
                style={[styles.emptyAddBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Icon name="plus" size={16} color={colors.primary} />
                <Text style={[styles.emptyAddBtnText, { color: colors.primary }]}>Add as New Customer</Text>
              </TouchableOpacity>
            </View>
          }
          initialNumToRender={12}
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

  // Modals state
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [showAdvanceDetails, setShowAdvanceDetails] = useState(false);
  const [showNotesTerms, setShowNotesTerms] = useState(false);
  
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToNotes = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, []);

  const toggleNotesTerms = useCallback(() => {
    setShowNotesTerms((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
      return next;
    });
  }, []);

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

  const [lineItems, setLineItems] = useState([]);
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
        setLineItems((inv.line_items || []).map(li => ({
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
      : customers.filter(c => 
          c.name.toLowerCase().includes(lower) || 
          (c.phone && c.phone.toLowerCase().includes(lower)) ||
          (c.email && c.email.toLowerCase().includes(lower))
        );
    return all;
  }, [customers, recentCustomers, customerSearch]);

  const updateField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      if (e[field]) return { ...e, [field]: null };
      return e;
    });
  }, []);

  // Customer handlers
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

  const handleCustomerCreated = useCallback((newCustomer) => {
    selectCustomer(newCustomer);
    setShowNewCustomerModal(false);
    setShowCustomerPicker(false);
  }, [selectCustomer]);

  const removeSelectedCustomer = useCallback(() => {
    setForm(f => ({
      ...f,
      customer_id: null,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_address: '',
    }));
  }, []);

  // Inventory Multi-select handler
  const handleAddInventoryItems = useCallback((selectedItemsWithQuantities) => {
    setLineItems(prev => {
      const newItems = [...prev];

      for (const pItem of selectedItemsWithQuantities) {
        // If item already exists, increment its quantity
        const existingIdx = newItems.findIndex(i => i.item_id === pItem.id);
        if (existingIdx >= 0) {
          const currentQty = parseFloat(newItems[existingIdx].quantity) || 0;
          newItems[existingIdx] = {
            ...newItems[existingIdx],
            quantity: String(currentQty + (pItem.quantity || 1)),
          };
        } else {
          newItems.push({
            id: Date.now() + Math.random(),
            item_id: pItem.id,
            name: pItem.name,
            description: pItem.description || '',
            quantity: String(pItem.quantity || 1),
            unit_price: String(pItem.unit_price || 0),
            tax_rate: String(pItem.tax_rate || 0),
            mrp_price: String(pItem.mrp_price || 0),
            purchase_price: String(pItem.purchase_price || 0),
            max_stock: pItem.stock_quantity,
          });
        }
      }

      return newItems;
    });
  }, []);

  // Custom Item handler (add or update)
  const handleSaveCustomItem = useCallback((savedItem) => {
    setLineItems(prev => {
      const idx = prev.findIndex(i => i.id === savedItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedItem;
        return copy;
      }
      return [...prev, savedItem];
    });
    setItemToEdit(null);
  }, []);

  const updateLineItemQty = useCallback((id, delta) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const currentQty = parseFloat(item.quantity) || 1;
        let newQty = currentQty + delta;
        if (newQty < 1) newQty = 1;
        if (item.max_stock !== undefined && item.max_stock > 0 && newQty > item.max_stock) {
          Alert.alert('Stock Limit', `Only ${item.max_stock} units available in inventory.`);
          newQty = item.max_stock;
        }
        return { ...item, quantity: String(newQty) };
      }
      return item;
    }));
  }, []);

  const openEditItemModal = useCallback((item) => {
    setItemToEdit(item);
    setShowCustomItemModal(true);
  }, []);

  const removeLineItem = useCallback((id) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const validate = (status) => {
    const newErrors = {};
    if (!form.invoice_number) newErrors.invoice_number = 'Required';
    if (!form.issue_date) newErrors.issue_date = 'Required';
    if (!form.customer_name && status !== 'draft') newErrors.customer_name = 'Please attach a customer';
    
    const hasValidItems = lineItems.some(li => li.name && parseFloat(li.quantity) > 0);
    if (!hasValidItems) newErrors.line_items = 'Add at least one item to the invoice';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async (status) => {
    if (!validate(status)) {
      if (errors.customer_name) {
        Alert.alert('Customer Required', 'Please select or add a customer to proceed.');
      } else if (errors.line_items) {
        Alert.alert('Items Required', 'Please add at least one line item to the invoice.');
      } else {
        Alert.alert('Validation Error', 'Please check the required fields.');
      }
      return;
    }

    setSaving(true);
    try {
      const calculatedItems = lineItems
        .filter(li => li.name && parseFloat(li.quantity) > 0)
        .map(li => ({
          ...li,
          quantity: parseFloat(li.quantity) || 1,
          unit_price: parseFloat(li.unit_price) || 0,
          purchase_price: parseFloat(li.purchase_price) || 0,
          mrp_price: parseFloat(li.mrp_price) || 0,
          tax_rate: settings.enable_tax ? (parseFloat(li.tax_rate) || 0) : 0,
        }));

      const invoiceData = {
        invoice_number: form.invoice_number.trim(),
        customer_id: form.customer_id,
        customer_name: form.customer_name.trim(),
        customer_email: (form.customer_email || '').trim(),
        customer_phone: (form.customer_phone || '').trim(),
        customer_address: (form.customer_address || '').trim(),
        status: status,
        issue_date: form.issue_date,
        due_date: form.due_date,
        currency: form.currency,
        notes: form.notes,
        terms: form.terms,
        discount: parseFloat(form.discount) || 0,
        discount_type: form.discount_type,
        subtotal: totals.subtotal,
        tax_rate: settings.enable_tax ? totals.tax_rate : 0,
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
  }, [form, lineItems, totals, isEdit, editId, settings, navigation, createInvoice, updateInvoice, fetchInvoiceById, errors]);

  const customerInitials = useMemo(() => {
    return (form.customer_name || 'C')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }, [form.customer_name]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 120 }
          ]} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Condensed Invoice Info Header */}
          <View style={[styles.compactInfoRow, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.infoBadge}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>INVOICE NO</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{form.invoice_number || '---'}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>ISSUE DATE</Text>
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
                <AppInput 
                  label="Manual Invoice Number" 
                  value={form.invoice_number} 
                  onChangeText={(v) => updateField('invoice_number', v)} 
                  leftIcon="pound" 
                />
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <AppInput 
                      label="Issue Date" 
                      value={form.issue_date} 
                      onChangeText={(v) => updateField('issue_date', v)} 
                      leftIcon="calendar" 
                    />
                  </View>
                  <View style={styles.halfField}>
                    <AppInput 
                      label="Due Date" 
                      value={form.due_date || ''} 
                      onChangeText={(v) => updateField('due_date', v)} 
                      leftIcon="calendar-clock" 
                    />
                  </View>
                </View>
              </AppCard>
            </Animated.View>
          )}

          {/* SECTION 1: CUSTOMER SELECTION */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <AppCard style={styles.customerSectionCard}>
              {!form.customer_name ? (
                /* Unselected State: Only 2 Sleek Action Buttons */
                <View style={styles.customerActionRow}>
                  <TouchableOpacity
                    onPress={() => setShowNewCustomerModal(true)}
                    style={[styles.customerActionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  >
                    <Icon name="account-plus-outline" size={18} color={colors.primary} />
                    <Text style={[styles.customerActionText, { color: colors.primary }]}>+ New Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowCustomerPicker(true)}
                    style={[styles.customerActionBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}
                  >
                    <Icon name="account-search-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.customerActionText, { color: colors.textPrimary }]}>Choose Existing</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Selected State: Pure Minimalist Customer Card (tap name/card to view details) */
                <TouchableOpacity
                  onPress={() => setShowCustomerDetailModal(true)}
                  activeOpacity={0.7}
                  style={styles.minimalSelectedCustomer}
                >
                  <View style={styles.selectedCustomerInfo}>
                    <Text style={[styles.selectedCustomerName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {form.customer_name}
                    </Text>
                    {(form.customer_phone || form.customer_email || form.customer_address) ? (
                      <Text style={[styles.selectedCustomerSub, { color: colors.textTertiary }]} numberOfLines={1}>
                        {[form.customer_phone, form.customer_email].filter(Boolean).join(' • ') || form.customer_address}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.selectedCustomerActions}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowCustomerPicker(true);
                      }}
                      style={[styles.swapCustomerBtn, { backgroundColor: colors.surfaceVariant }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.swapCustomerText, { color: colors.primary }]}>Change</Text>
                    </TouchableOpacity>
                    <Icon name="chevron-right" size={20} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              )}
            </AppCard>
          </Animated.View>

          {/* SECTION 2: LINE ITEMS */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="format-list-bulleted" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
                  {lineItems.length > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.countBadgeText, { color: colors.primary }]}>{lineItems.length}</Text>
                    </View>
                  )}
                </View>


              </View>

              {/* Items List or Minimalist Empty State */}
              {lineItems.length === 0 ? (
                <View style={[styles.emptyItemsBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
                  <Icon name="cart-outline" size={36} color={colors.textTertiary} />
                  <Text style={[styles.emptyItemsTitle, { color: colors.textSecondary }]}>No items added yet</Text>
                  <Text style={[styles.emptyItemsSub, { color: colors.textTertiary }]}>
                    Choose products from your inventory or add a custom line item
                  </Text>
                  <View style={styles.emptyItemButtons}>
                    <TouchableOpacity
                      onPress={() => setShowInventoryPicker(true)}
                      style={[styles.emptyAddAction, { backgroundColor: colors.primary }]}
                    >
                      <Icon name="package-variant-closed" size={16} color="#fff" />
                      <Text style={styles.emptyAddActionText}>From Inventory</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setItemToEdit(null);
                        setShowCustomItemModal(true);
                      }}
                      style={[styles.emptyAddActionOutline, { borderColor: colors.borderLight }]}
                    >
                      <Icon name="plus" size={16} color={colors.textPrimary} />
                      <Text style={[styles.emptyAddActionOutlineText, { color: colors.textPrimary }]}>Custom Item</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.conciseListWrap}>
                  {lineItems.map((item, index) => (
                    <ConciseLineItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      currency={form.currency}
                      showTax={settings.enable_tax}
                      onUpdateQty={updateLineItemQty}
                      onEdit={openEditItemModal}
                      onRemove={removeLineItem}
                    />
                  ))}

                  {/* Minimal Subtle Add More Row */}
                  <View style={styles.addMoreRow}>
                    <TouchableOpacity
                      onPress={() => setShowInventoryPicker(true)}
                      style={[styles.addMoreBtn, { backgroundColor: colors.surfaceVariant }]}
                    >
                      <Icon name="package-variant-closed" size={15} color={colors.primary} />
                      <Text style={[styles.addMoreText, { color: colors.primary }]}>From Inventory</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setItemToEdit(null);
                        setShowCustomItemModal(true);
                      }}
                      style={[styles.addMoreBtn, { backgroundColor: colors.surfaceVariant }]}
                    >
                      <Icon name="plus" size={15} color={colors.textPrimary} />
                      <Text style={[styles.addMoreText, { color: colors.textPrimary }]}>Custom Item</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </AppCard>
          </Animated.View>

          {/* SECTION 3: SUMMARY */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <AppCard style={[styles.section, styles.summarySection]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="calculator" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Summary</Text>
                </View>
              </View>
              
              {/* Compact Inline Discount Row */}
              <View style={[styles.compactDiscountRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight }]}>
                <View style={styles.discountLeft}>
                  <Icon name="tag-outline" size={15} color={colors.textSecondary} />
                  <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Discount</Text>
                </View>
                <View style={styles.discountRight}>
                  <TextInput
                    value={form.discount === '0' ? '' : form.discount}
                    onChangeText={(v) => updateField('discount', v)}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    style={[styles.discountInput, { color: colors.textPrimary }]}
                  />
                  <TouchableOpacity
                    onPress={() => updateField('discount_type', form.discount_type === 'percentage' ? 'fixed' : 'percentage')}
                    style={[styles.discountTypeBtn, { backgroundColor: colors.primary }]}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.discountTypeText}>{form.discount_type === 'percentage' ? '%' : (form.currency || 'FIX')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <InvoiceSummary totals={totals} currency={form.currency} showTax={settings.enable_tax} flat={true} />
            </AppCard>

            {/* SECTION 4: NOTES & TERMS (Compact Collapsible Accordion) */}
            <AppCard style={[styles.section, styles.notesSection]}>
              <TouchableOpacity
                onPress={toggleNotesTerms}
                activeOpacity={0.7}
                style={styles.notesAccordionHeader}
              >
                <View style={styles.sectionTitleRow}>
                  <Icon name="file-document-edit-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes & Terms</Text>
                  {(form.notes || form.terms) ? (
                    <View style={[styles.countBadge, { backgroundColor: colors.successLight || '#D1FAE5' }]}>
                      <Text style={[styles.countBadgeText, { color: colors.success || '#059669' }]}>Set</Text>
                    </View>
                  ) : (
                    <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.countBadgeText, { color: colors.textTertiary }]}>Optional</Text>
                    </View>
                  )}
                </View>

                <View style={styles.notesHeaderRight}>
                  <Text style={[styles.toggleHintText, { color: colors.primary }]}>
                    {showNotesTerms ? 'Hide' : 'Edit'}
                  </Text>
                  <Icon
                    name={showNotesTerms ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>

              {/* Collapsed State: Concise 1-2 line snippet */}
              {!showNotesTerms && (
                <TouchableOpacity
                  onPress={toggleNotesTerms}
                  activeOpacity={0.7}
                  style={styles.notesCollapsedPreview}
                >
                  {form.notes ? (
                    <Text style={[styles.snippetText, { color: colors.textSecondary }]} numberOfLines={1}>
                      <Text style={[styles.snippetLabel, { color: colors.textTertiary }]}>Note: </Text>
                      {form.notes}
                    </Text>
                  ) : null}
                  {form.terms ? (
                    <Text style={[styles.snippetText, { color: colors.textSecondary, marginTop: form.notes ? 3 : 0 }]} numberOfLines={1}>
                      <Text style={[styles.snippetLabel, { color: colors.textTertiary }]}>Terms: </Text>
                      {form.terms}
                    </Text>
                  ) : null}
                  {!form.notes && !form.terms && (
                    <Text style={[styles.emptySnippetText, { color: colors.textTertiary }]}>
                      No notes or payment terms added (tap to edit)
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Expanded State: Clean minimal input boxes */}
              {showNotesTerms && (
                <View style={styles.notesExpandedContent}>
                  <View style={styles.compactNoteGroup}>
                    <View style={styles.compactNoteHeader}>
                      <Icon name="message-text-outline" size={13} color={colors.textTertiary} />
                      <Text style={[styles.compactNoteLabel, { color: colors.textTertiary }]}>PRIVATE NOTES</Text>
                    </View>
                    <TextInput
                      value={form.notes}
                      onChangeText={(v) => updateField('notes', v)}
                      onFocus={scrollToNotes}
                      multiline
                      numberOfLines={2}
                      placeholder="e.g. Project milestone reached..."
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.compactTextArea,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.compactNoteGroup, { marginTop: spacing.sm }]}>
                    <View style={styles.compactNoteHeader}>
                      <Icon name="shield-check-outline" size={13} color={colors.textTertiary} />
                      <Text style={[styles.compactNoteLabel, { color: colors.textTertiary }]}>TERMS & CONDITIONS</Text>
                    </View>
                    <TextInput
                      value={form.terms}
                      onChangeText={(v) => updateField('terms', v)}
                      onFocus={scrollToNotes}
                      multiline
                      numberOfLines={2}
                      placeholder="e.g. Payment due within 15 days..."
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.compactTextArea,
                        {
                          color: colors.textPrimary,
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </AppCard>
          </Animated.View>

          {/* Action Buttons */}
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

      {/* MODALS */}
      
      {/* 1. Existing Customers Picker */}
      <CustomerPickerModal 
        visible={showCustomerPicker}
        data={filteredCustomers}
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        onSelect={selectCustomer}
        onClose={() => setShowCustomerPicker(false)}
        onAddNew={() => {
          setShowCustomerPicker(false);
          setShowNewCustomerModal(true);
        }}
        colors={colors}
      />

      {/* 2. New Customer Form Modal */}
      <NewCustomerModal
        visible={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
        colors={colors}
      />

      {/* 3. Customer Quick View Details Modal */}
      <CustomerDetailModal
        visible={showCustomerDetailModal}
        customer={form}
        onClose={() => setShowCustomerDetailModal(false)}
        onChangeCustomer={() => {
          setShowCustomerDetailModal(false);
          setShowCustomerPicker(true);
        }}
        onRemoveCustomer={removeSelectedCustomer}
        colors={colors}
      />

      {/* 4. Inventory Multi-Select Modal */}
      <InventoryMultiPickerModal
        visible={showInventoryPicker}
        items={predefinedItems}
        recentItems={recentItems}
        currency={form.currency}
        onClose={() => setShowInventoryPicker(false)}
        onAddSelected={handleAddInventoryItems}
        colors={colors}
      />

      {/* 5. Custom Line Item Modal (Add & Edit) */}
      <CustomItemModal
        visible={showCustomItemModal}
        itemToEdit={itemToEdit}
        showTax={settings.enable_tax}
        currency={form.currency}
        onClose={() => {
          setShowCustomItemModal(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveCustomItem}
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
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  linkText: { fontSize: 13, fontWeight: '600' },
  countBadge: { marginLeft: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  
  // Customer Selection Styles
  customerSectionCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  customerActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  customerActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  minimalSelectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  selectedCustomerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedCustomerSub: {
    fontSize: 12,
  },
  selectedCustomerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swapCustomerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  swapCustomerText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Items Header Actions
  itemsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  headerItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty Items Box
  emptyItemsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyItemsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyItemsSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
  },
  emptyItemButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyAddAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
  },
  emptyAddActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAddActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  emptyAddActionOutlineText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Concise list wrap
  conciseListWrap: {
    marginTop: spacing.xs,
  },
  addMoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Compact Discount Row
  compactDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  discountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  discountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountInput: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 50,
    paddingVertical: 0,
  },
  discountTypeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountTypeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Collapsible Notes & Terms
  notesSection: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  notesAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesCollapsedPreview: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  snippetText: {
    fontSize: 12,
    lineHeight: 18,
  },
  snippetLabel: {
    fontWeight: '700',
    fontSize: 11,
  },
  emptySnippetText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  notesExpandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  compactNoteGroup: {},
  compactNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  compactNoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  compactTextArea: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 12,
    lineHeight: 17,
    minHeight: 46,
    textAlignVertical: 'top',
  },

  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  footer: { flexDirection: 'row', marginTop: spacing.base },

  // Selection Modal Styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1 },
  modalCloseBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerActionBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSearch: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  modalList: { paddingBottom: 40 },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1 },
  modalEmpty: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerItemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customerItemName: { fontSize: 15, fontWeight: '700' },
  recentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recentText: { fontSize: 8, fontWeight: '800' },
  itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  customerItemSub: { fontSize: 12 },
});

export default CreateInvoiceScreen;
