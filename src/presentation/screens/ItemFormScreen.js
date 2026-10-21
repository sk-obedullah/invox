/**
 * ItemFormScreen - Add/Edit predefined item
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import useItemStore from '../../store/useItemStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import ItemRepository from '../../data/repositories/ItemRepository';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import { formatCurrency } from '../../utils/formatters';

const ItemFormScreen = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const editId = route?.params?.itemId;
  const isArchived = route?.params?.isArchived;
  const isEdit = !!editId;
  const { addItem, updateItem } = useItemStore();
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit_price: '',
    mrp_price: '',
    purchase_price: '',
    tax_rate: '',
    stock_quantity: '',
    min_stock_level: '0',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      ItemRepository.getById(editId).then((item) => { 
        if (item) {
          setForm({
            name: item.name,
            description: item.description || '',
            unit_price: item.unit_price ? item.unit_price.toString() : '',
            mrp_price: item.mrp_price ? item.mrp_price.toString() : '',
            purchase_price: item.purchase_price ? item.purchase_price.toString() : '',
            tax_rate: item.tax_rate ? item.tax_rate.toString() : '',
            stock_quantity: item.stock_quantity ? item.stock_quantity.toString() : '0',
            min_stock_level: item.min_stock_level ? item.min_stock_level.toString() : '0',
          });
        }
      });
    }
  }, [editId, isEdit]);

  const updateField = useCallback((field, value) => {
    // Only allow numbers and decimals for numeric fields
    const numericFields = ['unit_price', 'mrp_price', 'purchase_price', 'tax_rate', 'stock_quantity', 'min_stock_level'];
    let processedValue = value;
    if (numericFields.includes(field)) {
      processedValue = value.replace(/[^0-9.]/g, '');
    }
    
    setForm((f) => ({ ...f, [field]: processedValue }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  }, [errors]);

  const stats = useMemo(() => {
    const sell = parseFloat(form.unit_price) || 0;
    const cost = parseFloat(form.purchase_price) || 0;
    const mrp = parseFloat(form.mrp_price) || 0;
    
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    const discount = mrp > 0 ? ((mrp - sell) / mrp) * 100 : 0;

    return { profit, margin, discount };
  }, [form.unit_price, form.purchase_price, form.mrp_price]);

  const handleSave = useCallback(async () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Item name is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const dataToSave = {
        name: form.name.trim(),
        description: (form.description || '').trim(),
        unit_price: parseFloat(form.unit_price) || 0,
        mrp_price: parseFloat(form.mrp_price) || 0,
        purchase_price: parseFloat(form.purchase_price) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
        stock_quantity: parseFloat(form.stock_quantity) || 0,
        min_stock_level: parseFloat(form.min_stock_level) || 0,
      };

      if (isEdit) await updateItem(editId, dataToSave);
      else await addItem(dataToSave);
      navigation.goBack();
    } catch (err) { 
      Alert.alert('Error', err.message); 
    } finally { 
      setSaving(false); 
    }
  }, [form, isEdit, editId, addItem, updateItem, navigation]);

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
            {isArchived ? 'Archived Product' : (isEdit ? 'Edit Product' : 'New Product')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="package-variant-closed" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Information</Text>
              </View>
              <AppInput 
                label="Product Name" 
                placeholder="e.g. Wireless Mouse"
                value={form.name} 
                onChangeText={(v) => updateField('name', v)} 
                leftIcon="tag-outline" 
                required 
                error={errors.name} 
                editable={!isArchived}
              />
              <AppInput 
                label="Description" 
                placeholder="Brief details about this product..."
                value={form.description} 
                onChangeText={(v) => updateField('description', v)} 
                leftIcon="text-short" 
                multiline 
                numberOfLines={3} 
                editable={!isArchived}
              />
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="currency-usd" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Inventory</Text>
              </View>
              
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <AppInput 
                    label="MRP (Mkt. Price)" 
                    value={form.mrp_price} 
                    onChangeText={(v) => updateField('mrp_price', v)} 
                    leftIcon="tag-remove-outline" 
                    keyboardType="decimal-pad" 
                    placeholder="0.00"
                    selectTextOnFocus
                    editable={!isArchived}
                  />
                </View>
                <View style={styles.flex1}>
                  <AppInput 
                    label="Selling Price" 
                    value={form.unit_price} 
                    onChangeText={(v) => updateField('unit_price', v)} 
                    leftIcon="cash-check" 
                    keyboardType="decimal-pad" 
                    placeholder="0.00"
                    selectTextOnFocus
                    helperText={stats.discount > 0 ? <Text style={{ color: colors.success, fontWeight: '700' }}>{stats.discount.toFixed(0)}% Discount Applied</Text> : null}
                    editable={!isArchived}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <AppInput 
                    label="Cost (Purchase)" 
                    value={form.purchase_price} 
                    onChangeText={(v) => updateField('purchase_price', v)} 
                    leftIcon="wallet-outline" 
                    keyboardType="decimal-pad" 
                    placeholder="0.00"
                    selectTextOnFocus
                    editable={!isArchived}
                  />
                </View>
                {settings.enable_tax && (
                  <View style={styles.flex1}>
                    <AppInput 
                      label="Tax Rate (%)" 
                      value={form.tax_rate} 
                      onChangeText={(v) => updateField('tax_rate', v)} 
                      leftIcon="percent" 
                      keyboardType="decimal-pad" 
                      placeholder="0"
                      selectTextOnFocus
                      editable={!isArchived}
                    />
                  </View>
                )}
              </View>
            </AppCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="archive-outline" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Inventory Control</Text>
              </View>
              
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <AppInput 
                    label={isEdit ? "Current Stock" : "Opening Stock"}
                    value={form.stock_quantity} 
                    onChangeText={(v) => updateField('stock_quantity', v)} 
                    leftIcon="numeric" 
                    keyboardType="numeric" 
                    placeholder="0"
                    selectTextOnFocus
                    editable={!isArchived}
                  />
                </View>
                <View style={styles.flex1}>
                  <AppInput 
                    label="Min Level Alert" 
                    value={form.min_stock_level} 
                    onChangeText={(v) => updateField('min_stock_level', v)} 
                    leftIcon="bell-outline" 
                    keyboardType="numeric" 
                    placeholder="0"
                    selectTextOnFocus
                    editable={!isArchived}
                  />
                </View>
              </View>
              <Text style={[styles.stockHelper, { color: colors.textTertiary, fontSize: 11, marginTop: spacing.sm }]}>
                {isEdit 
                  ? "Adjust current quantity. Manual changes will be tracked." 
                  : "Enter the total units you have in stock right now."}
              </Text>
            </AppCard>
          </Animated.View>

          {/* Live Profit Preview */}
          {(parseFloat(form.unit_price) > 0 || parseFloat(form.purchase_price) > 0) && (
            <Animated.View entering={FadeIn.duration(500)}>
              <View style={[styles.profitCard, { backgroundColor: stats.profit >= 0 ? colors.successLight : colors.errorLight }]}>
                <View style={styles.profitInfo}>
                  <Text style={[styles.profitLabel, { color: stats.profit >= 0 ? colors.success : colors.error }]}>Expected Profit per Unit</Text>
                  <Text style={[styles.profitValue, { color: stats.profit >= 0 ? colors.success : colors.error }]}>
                    {formatCurrency(stats.profit, settings.default_currency)}
                  </Text>
                </View>
                <View style={[styles.marginBadge, { backgroundColor: stats.profit >= 0 ? colors.success : colors.error }]}>
                  <Text style={styles.marginText}>{stats.margin.toFixed(1)}% Margin</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {!isArchived && (
            <View style={styles.footer}>
              <AppButton 
                title={isEdit ? 'Update Product' : 'Save Product'} 
                icon="check-circle" 
                onPress={handleSave} 
                loading={saving} 
                fullWidth 
                style={elevation.md}
              />
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  content: { padding: spacing.base },
  section: { padding: spacing.md, marginBottom: spacing.lg, borderRadius: borderRadius.xl, ...elevation.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  row: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  
  profitCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: spacing.lg, 
    borderRadius: borderRadius.lg, 
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  profitInfo: { flex: 1 },
  profitLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  profitValue: { fontSize: 22, fontWeight: '800' },
  marginBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md },
  marginText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  
  footer: { marginTop: spacing.sm },
});

export default ItemFormScreen;
