/**
 * ItemFormScreen - Add/Edit predefined item
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing } from '../../theme/spacing';
import useItemStore from '../../store/useItemStore';
import ItemRepository from '../../data/repositories/ItemRepository';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';

const ItemFormScreen = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const editId = route?.params?.itemId;
  const isEdit = !!editId;
  const { addItem, updateItem } = useItemStore();
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit_price: '0.00',
    tax_rate: '0',
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
            unit_price: item.unit_price ? item.unit_price.toString() : '0.00',
            tax_rate: item.tax_rate ? item.tax_rate.toString() : '0',
          });
        }
      });
    }
  }, [editId]);

  const updateField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }, []);

  const handleSave = useCallback(async () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const dataToSave = {
        name: form.name.trim(),
        description: form.description.trim(),
        unit_price: parseFloat(form.unit_price) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{isEdit ? 'Edit Item' : 'New Item'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppCard style={styles.section}>
          <AppInput label="Name" value={form.name} onChangeText={(v) => updateField('name', v)} leftIcon="tag-outline" required error={errors.name} />
          <AppInput label="Description" value={form.description} onChangeText={(v) => updateField('description', v)} leftIcon="text" multiline numberOfLines={3} />
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppInput label="Price / Rate" value={form.unit_price} onChangeText={(v) => updateField('unit_price', v)} leftIcon="currency-usd" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="Tax Rate (%)" value={form.tax_rate} onChangeText={(v) => updateField('tax_rate', v)} leftIcon="percent-outline" keyboardType="numeric" />
            </View>
          </View>
        </AppCard>
        
        <AppButton title={isEdit ? 'Update' : 'Save Item'} icon="check" onPress={handleSave} loading={saving} fullWidth />
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
  row: { flexDirection: 'row', gap: spacing.md },
});

export default ItemFormScreen;
