/**
 * EditSettingsScreen - Form to edit app configuration
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius } from '../../theme/spacing';
import { useSettingsStore } from '../../store/useSettingsStore';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import { CURRENCIES } from '../../constants/currencies';
import { TEMPLATES } from '../../constants/templates';

const EditSettingsScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: settings.company_name || '',
    company_email: settings.company_email || '',
    company_phone: settings.company_phone || '',
    company_address: settings.company_address || '',
    invoice_prefix: settings.invoice_prefix || '',
    next_invoice_number: String(settings.next_invoice_number || 1001),
    default_tax_rate: String(settings.default_tax_rate || 0),
    default_currency: settings.default_currency || 'USD',
    default_notes: settings.default_notes || '',
    default_terms: settings.default_terms || '',
    theme: settings.theme || 'system',
    template: settings.template || 'modern',
    bank_account_name: settings.bank_account_name || '',
    bank_account_no: settings.bank_account_no || '',
    bank_ifsc: settings.bank_ifsc || '',
    bank_branch: settings.bank_branch || '',
    bank_mobile: settings.bank_mobile || '',
    upi_id: settings.upi_id || '',
    thanks_note: settings.thanks_note || 'Thank you for your business!',
    qr_code_path: settings.qr_code_path || '',
  });
  
  const [logoPath, setLogoPath] = useState(settings.company_logo_path);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePickLogo = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', maxWidth: 500, maxHeight: 500, quality: 0.8 });
      if (result.assets?.[0]?.uri) {
        setLogoPath(result.assets[0].uri);
      }
    } catch (err) { console.error(err); }
  }, []);

  const handlePickQrCode = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', maxWidth: 1000, maxHeight: 1000, quality: 0.8 });
      if (result.assets?.[0]?.uri) {
        updateField('qr_code_path', result.assets[0].uri);
      }
    } catch (err) { console.error(err); }
  }, [updateField]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await settings.updateSettings({
        ...form,
        next_invoice_number: parseInt(form.next_invoice_number) || 1,
        default_tax_rate: parseFloat(form.default_tax_rate) || 0,
      });
      if (logoPath !== settings.company_logo_path) {
        await settings.updateLogoPath(logoPath);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [form, logoPath, settings, navigation]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Info</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            <Text style={[styles.saveBtnText, { color: colors.primary }]}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Company Info */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Company Info</Text>
            
            <TouchableOpacity onPress={handlePickLogo} style={[styles.logoPicker, { borderColor: colors.border }]}>
              {logoPath ? (
                <Image source={{ uri: logoPath }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Icon name="camera-plus-outline" size={28} color={colors.placeholder} />
                  <Text style={[styles.logoText, { color: colors.placeholder }]}>Add Logo</Text>
                </View>
              )}
            </TouchableOpacity>

            <AppInput label="Company Name" value={form.company_name} onChangeText={(v) => updateField('company_name', v)} leftIcon="domain" />
            <AppInput label="Email" value={form.company_email} onChangeText={(v) => updateField('company_email', v)} leftIcon="email-outline" keyboardType="email-address" />
            <AppInput label="Phone" value={form.company_phone} onChangeText={(v) => updateField('company_phone', v)} leftIcon="phone-outline" keyboardType="phone-pad" />
            <AppInput label="Address" value={form.company_address} onChangeText={(v) => updateField('company_address', v)} leftIcon="map-marker-outline" multiline numberOfLines={3} />
          </AppCard>

          {/* Invoice Defaults */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Invoice Defaults</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput label="Prefix" value={form.invoice_prefix} onChangeText={(v) => updateField('invoice_prefix', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Next Number" value={form.next_invoice_number} onChangeText={(v) => updateField('next_invoice_number', v)} keyboardType="number-pad" />
              </View>
            </View>
            <AppInput label="Default Tax Rate (%)" value={form.default_tax_rate} onChangeText={(v) => updateField('default_tax_rate', v)} keyboardType="decimal-pad" />
            
            {/* Currency Selector */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Currency</Text>
            <View style={styles.currencyGrid}>
              {CURRENCIES.slice(0, 6).map((c) => (
                <TouchableOpacity key={c.code} onPress={() => updateField('default_currency', c.code)}
                  style={[styles.currencyBtn, { backgroundColor: form.default_currency === c.code ? colors.primary : colors.surfaceVariant, borderColor: form.default_currency === c.code ? colors.primary : colors.border }]}>
                  <Text style={{ color: form.default_currency === c.code ? '#FFF' : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{c.symbol} {c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppInput label="Default Notes" value={form.default_notes} onChangeText={(v) => updateField('default_notes', v)} multiline numberOfLines={2} />
            <AppInput label="Default Terms" value={form.default_terms} onChangeText={(v) => updateField('default_terms', v)} multiline numberOfLines={2} />
          </AppCard>

          {/* Appearance */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Theme</Text>
            <View style={styles.themeRow}>
              {['light', 'dark', 'system'].map((t) => (
                <TouchableOpacity key={t} onPress={() => updateField('theme', t)}
                  style={[styles.themeBtn, { backgroundColor: form.theme === t ? colors.primary : colors.surfaceVariant, borderColor: form.theme === t ? colors.primary : colors.border }]}>
                  <Icon name={t === 'light' ? 'white-balance-sunny' : t === 'dark' ? 'moon-waning-crescent' : 'theme-light-dark'} size={18} color={form.theme === t ? '#FFF' : colors.textSecondary} />
                  <Text style={{ color: form.theme === t ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: '500', marginLeft: 6, textTransform: 'capitalize' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.base }]}>Invoice Template</Text>
            <View style={styles.themeRow}>
              {TEMPLATES.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => updateField('template', t.id)}
                  style={[styles.themeBtn, { backgroundColor: form.template === t.id ? colors.primary : colors.surfaceVariant, borderColor: form.template === t.id ? colors.primary : colors.border }]}>
                  <Text style={{ color: form.template === t.id ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Payment & Bank Details */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bank Account Details</Text>
            <AppInput label="Account Holder Name" value={form.bank_account_name} onChangeText={(v) => updateField('bank_account_name', v)} leftIcon="account-outline" />
            <AppInput label="Account Number" value={form.bank_account_no} onChangeText={(v) => updateField('bank_account_no', v)} leftIcon="bank-outline" keyboardType="number-pad" />
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput label="IFSC Code" value={form.bank_ifsc} onChangeText={(v) => updateField('bank_ifsc', v)} autoCapitalize="characters" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Branch" value={form.bank_branch} onChangeText={(v) => updateField('bank_branch', v)} />
              </View>
            </View>
            
            <AppInput label="Bank Mobile Number" value={form.bank_mobile} onChangeText={(v) => updateField('bank_mobile', v)} leftIcon="phone-outline" keyboardType="phone-pad" />
            
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.md }]}>UPI Details</Text>
            <AppInput label="UPI ID" value={form.upi_id} onChangeText={(v) => updateField('upi_id', v)} leftIcon="qrcode" placeholder="yourname@bank" autoCapitalize="none" />
            
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.sm }]}>Custom QR Code (Optional)</Text>
            <TouchableOpacity onPress={handlePickQrCode} style={[styles.qrPicker, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
              {form.qr_code_path ? (
                <View style={styles.qrPreviewContainer}>
                  <Image source={{ uri: form.qr_code_path }} style={styles.qrImage} />
                  <View style={[styles.qrOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                    <Icon name="pencil" size={20} color="#FFF" />
                  </View>
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Icon name="qrcode-scan" size={28} color={colors.placeholder} />
                  <Text style={[styles.logoText, { color: colors.placeholder }]}>Upload Payment QR</Text>
                </View>
              )}
            </TouchableOpacity>
          </AppCard>

          {/* Additional Notes */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Thank You Note</Text>
            <AppInput label="Thanks Note (End of PDF)" value={form.thanks_note} onChangeText={(v) => updateField('thanks_note', v)} multiline numberOfLines={3} />
          </AppCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.base },
  section: { marginBottom: spacing.base },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  logoPicker: { width: 100, height: 100, alignSelf: 'center', borderRadius: borderRadius.lg, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.base, overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  logoPlaceholder: { alignItems: 'center' },
  logoText: { fontSize: 11, marginTop: 4 },
  qrPicker: { width: '100%', height: 120, borderRadius: borderRadius.lg, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs, overflow: 'hidden' },
  qrPreviewContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  qrImage: { width: 100, height: 100, resizeMode: 'contain' },
  qrOverlay: { position: 'absolute', right: 8, bottom: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1 },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1 },
});

export default EditSettingsScreen;
