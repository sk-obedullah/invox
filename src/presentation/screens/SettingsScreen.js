/**
 * SettingsScreen - App configuration Dashboard (Read Only)
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { moderateScale, moderateFontScale, isSmallDevice } from '../../utils/responsive';
import { useSettingsStore } from '../../store/useSettingsStore';
import { pick, saveDocuments, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import BackupService from '../../services/BackupService';
import ShareService from '../../services/ShareService';
import { CURRENCIES } from '../../constants/currencies';
import { TEMPLATES } from '../../constants/templates';

const InfoRow = ({ icon, label, value, colors, isMultiline }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconWrapper, { backgroundColor: colors.surfaceVariant }]}>
      <Icon name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.infoTextWrapper}>
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={isMultiline ? undefined : 1}>
        {value || 'Not set'}
      </Text>
    </View>
  </View>
);

const SettingsScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const [saving, setSaving] = useState(false);

  const handleBackup = useCallback(async () => {
    setSaving(true);
    try {
      const path = await BackupService.createBackup();
      
      const fileName = path.split('/').pop();
      const sourceUri = 'file://' + path;

      await saveDocuments({
        sourceUris: [sourceUri],
        mimeType: types.json,
        fileName: fileName,
      });

      Alert.alert('Backup Saved', 'Your backup was successfully saved to the chosen folder.');
    } catch (err) {
      if (!isErrorWithCode(err, errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', err.message);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    try {
      const result = await pick({
        mode: 'open',
        allowMultiSelection: false,
        type: [types.json, types.allFiles],
      });

      const file = result[0];

      Alert.alert(
        'Restore Backup',
        `Are you sure you want to restore from the selected backup file?\n\nWarning: This will add to your current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Restore', 
            style: 'destructive',
            onPress: async () => {
              setSaving(true);
              try {
                const stats = await BackupService.restoreFromFile(file.uri);
                Alert.alert('Success', `Restored ${stats.invoicesRestored} invoices, ${stats.customersRestored} customers, and ${stats.itemsRestored} items! Please restart the app.`);
              } catch (e) {
                Alert.alert('Error', 'Failed to restore: ' + e.message);
              } finally {
                setSaving(false);
              }
            }
          }
        ]
      );
    } catch (err) {
      if (!isErrorWithCode(err, errorCodes.OPERATION_CANCELED)) {
        Alert.alert('Error', 'Failed to pick file: ' + err.message);
      }
    }
  }, []);

  const getCurrencySymbol = (code) => {
    const curr = CURRENCIES.find(c => c.code === code);
    return curr ? `${curr.symbol} ${curr.code}` : code;
  };

  const getTemplateName = (id) => {
    const t = TEMPLATES.find(temp => temp.id === id);
    return t ? t.name : id;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditSettings')} style={[styles.editBtn, { backgroundColor: colors.primaryLight }]}>
          <Icon name="pencil" size={18} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Info</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.logoContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {settings.company_logo_path ? (
              <Image source={{ uri: settings.company_logo_path }} style={styles.logoImage} />
            ) : (
              <Icon name="domain" size={40} color={colors.placeholder} />
            )}
          </View>
          <View style={styles.profileTitleContainer}>
            <Text style={[styles.companyName, { color: colors.textPrimary }]}>{settings.company_name || 'My Company'}</Text>
            <Text style={[styles.companySubtitle, { color: colors.textSecondary }]}>Business Profile</Text>
          </View>
        </View>

        {/* Company Info */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact Information</Text>
          <View style={styles.infoList}>
            <InfoRow icon="email-outline" label="Email Address" value={settings.company_email} colors={colors} />
            <InfoRow icon="phone-outline" label="Phone Number" value={settings.company_phone} colors={colors} />
            <InfoRow icon="map-marker-outline" label="Physical Address" value={settings.company_address} colors={colors} isMultiline={true} />
          </View>
        </AppCard>

        {/* Invoice Defaults */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Invoice Defaults</Text>
          <View style={styles.infoList}>
            <View style={styles.splitRow}>
              <View style={styles.splitHalf}>
                <InfoRow icon="pound" label="Prefix" value={settings.invoice_prefix} colors={colors} />
              </View>
              <View style={styles.splitHalf}>
                <InfoRow icon="numeric" label="Next No." value={String(settings.next_invoice_number)} colors={colors} />
              </View>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.splitHalf}>
                <InfoRow icon="cash-multiple" label="Currency" value={getCurrencySymbol(settings.default_currency)} colors={colors} />
              </View>
              <View style={styles.splitHalf}>
                <InfoRow icon="percent" label="Tax Rate" value={`${settings.default_tax_rate}%`} colors={colors} />
              </View>
            </View>
            <InfoRow icon="text-box-outline" label="Default Notes" value={settings.default_notes} colors={colors} isMultiline={true} />
            <InfoRow icon="file-document-outline" label="Default Terms" value={settings.default_terms} colors={colors} isMultiline={true} />
          </View>
        </AppCard>

        {/* Appearance */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance Settings</Text>
          <View style={styles.infoList}>
            <InfoRow icon="theme-light-dark" label="App Theme" value={settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)} colors={colors} />
            <InfoRow icon="palette-outline" label="PDF Template" value={getTemplateName(settings.template)} colors={colors} />
          </View>
        </AppCard>

        {/* Payment Details */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Details</Text>
          <View style={styles.infoList}>
            <InfoRow icon="account-tie-outline" label="Account Holder" value={settings.bank_account_name} colors={colors} />
            <InfoRow icon="bank-outline" label="Account Number" value={settings.bank_account_no} colors={colors} />
            <View style={styles.splitRow}>
              <View style={styles.splitHalf}>
                <InfoRow icon="barcode-scan" label="IFSC Code" value={settings.bank_ifsc} colors={colors} />
              </View>
              <View style={styles.splitHalf}>
                <InfoRow icon="map-marker-radius-outline" label="Branch" value={settings.bank_branch} colors={colors} />
              </View>
            </View>
            <InfoRow icon="qrcode" label="UPI ID" value={settings.upi_id} colors={colors} />
            
            {settings.qr_code_path && (
              <View style={styles.qrDisplayContainer}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>Custom QR Code</Text>
                <View style={[styles.qrPreview, { borderColor: colors.border }]}>
                  <Image source={{ uri: settings.qr_code_path }} style={styles.qrImage} />
                </View>
              </View>
            )}
            
            <InfoRow icon="heart-outline" label="Thank You Note" value={settings.thanks_note} colors={colors} isMultiline={true} />
          </View>
        </AppCard>

        {/* Data & Backup */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Securely backup your entire local database or restore from your most recent local backup.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <AppButton title="Create Local Backup" icon="cloud-upload-outline" variant="outline" onPress={handleBackup} loading={saving} fullWidth />
            <AppButton title="Restore Latest Backup" icon="cloud-download-outline" variant="outline" onPress={handleRestore} disabled={saving} fullWidth />
          </View>
        </AppCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  headerTitle: { fontSize: moderateFontScale(28), fontWeight: '800', letterSpacing: -0.5 },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, gap: 6 },
  editBtnText: { fontSize: moderateFontScale(13), fontWeight: '600' },
  content: { padding: moderateScale(spacing.base) },
  
  profileHeader: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
  logoContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: spacing.md, ...elevation.sm },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  profileTitleContainer: { alignItems: 'center' },
  companyName: { fontSize: moderateFontScale(24), fontWeight: '700', marginBottom: 4 },
  companySubtitle: { fontSize: moderateFontScale(13), fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  
  section: { marginBottom: spacing.lg, padding: moderateScale(spacing.lg) },
  sectionTitle: { fontSize: moderateFontScale(15), fontWeight: '700', marginBottom: spacing.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  infoList: { gap: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoIconWrapper: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  infoTextWrapper: { flex: 1, justifyContent: 'center', paddingTop: 2 },
  infoLabel: { fontSize: moderateFontScale(11), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: moderateFontScale(15), fontWeight: '500', lineHeight: 22 },
  
  splitRow: { flexDirection: 'row', flexWrap: isSmallDevice ? 'wrap' : 'nowrap', gap: spacing.md },
  splitHalf: { flex: 1, minWidth: isSmallDevice ? '45%' : 'auto' },
  qrDisplayContainer: { marginTop: spacing.xs, alignItems: 'center', alignSelf: 'flex-start' },
  qrPreview: { width: 120, height: 120, borderRadius: borderRadius.md, borderWidth: 1, padding: 8, backgroundColor: '#FFF' },
  qrImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  helperText: { fontSize: moderateFontScale(13), lineHeight: 20 },
});

export default SettingsScreen;
