/**
 * InvoiceDetailScreen - View invoice with actions (edit, delete, pdf, share)
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import AppCard from '../components/common/AppCard';
import AppButton from '../components/common/AppButton';
import StatusBadge from '../components/invoice/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import InvoiceSummary from '../components/invoice/InvoiceSummary';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PdfService from '../../services/PdfService';
import ShareService from '../../services/ShareService';
import { INVOICE_STATUS } from '../../constants/invoiceStatus';

const InvoiceDetailScreen = ({ navigation, route }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const invoiceId = route.params.invoiceId;

  const { currentInvoice: invoice, isLoading, fetchInvoiceById, deleteInvoice, updateInvoiceStatus } = useInvoiceStore();
  const settings = useSettingsStore();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchInvoiceById(invoiceId); }, [invoiceId]);

  const handleEdit = useCallback(() => {
    navigation.navigate('CreateInvoice', { invoiceId });
  }, [invoiceId, navigation]);

  const handleDelete = useCallback(async () => {
    setDeleteDialogVisible(false);
    await deleteInvoice(invoiceId);
    navigation.goBack();
  }, [invoiceId]);

  const handleStatusChange = useCallback(async (status) => {
    await updateInvoiceStatus(invoiceId, status);
    fetchInvoiceById(invoiceId);
  }, [invoiceId]);

  const handleGeneratePdf = useCallback(async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const pdfPath = await PdfService.generateInvoicePdf(invoice, settings, settings.template);
      Alert.alert('Success', 'PDF generated successfully', [
        { text: 'Share', onPress: () => ShareService.sharePdf(pdfPath, invoice.invoice_number) },
        { text: 'OK' },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setGenerating(false);
    }
  }, [invoice, settings]);

  if (isLoading || !invoice) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Invoice</Text>
        <TouchableOpacity onPress={() => setDeleteDialogVisible(true)}>
          <Icon name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Invoice Header Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AppCard style={styles.invoiceHeader}>
            <View style={styles.invoiceHeaderTop}>
              <View>
                <Text style={[styles.invoiceNumber, { color: colors.primary }]}>{invoice.invoice_number}</Text>
                <Text style={[styles.invoiceDate, { color: colors.textSecondary }]}>{formatDate(invoice.issue_date, 'DD MMM YYYY, HH:mm:ss')}</Text>
              </View>
              <StatusBadge status={invoice.status} size="lg" />
            </View>
            <View style={[styles.totalContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.totalLabel, { color: colors.primary }]}>Total Amount</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>{formatCurrency(invoice.total, invoice.currency)}</Text>
            </View>
          </AppCard>
        </Animated.View>

        {/* Customer Info */}
        {invoice.customer_name && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <AppCard style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>BILL TO</Text>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>{invoice.customer_name}</Text>
              {invoice.customer_email ? <Text style={[styles.customerDetail, { color: colors.textSecondary }]}>{invoice.customer_email}</Text> : null}
              {invoice.customer_phone ? <Text style={[styles.customerDetail, { color: colors.textSecondary }]}>{invoice.customer_phone}</Text> : null}
              {invoice.customer_address ? <Text style={[styles.customerDetail, { color: colors.textSecondary }]}>{invoice.customer_address}</Text> : null}
            </AppCard>
          </Animated.View>
        )}

        {/* Line Items */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <AppCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ITEMS</Text>
            {(invoice.line_items || []).map((item, i) => (
              <View key={i} style={[styles.lineItem, i < invoice.line_items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
                <View style={styles.lineItemTop}>
                  <Text style={[styles.lineItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.lineItemAmount, { color: colors.textPrimary }]}>{formatCurrency(item.amount, invoice.currency)}</Text>
                </View>
                <Text style={[styles.lineItemMeta, { color: colors.textTertiary }]}>
                  {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                  {item.tax_rate > 0 ? ` (+${item.tax_rate}% tax)` : ''}
                </Text>
              </View>
            ))}
          </AppCard>
        </Animated.View>

        {/* Summary */}
        <InvoiceSummary subtotal={invoice.subtotal} taxAmount={invoice.tax_amount} discount={invoice.discount} total={invoice.total} currency={invoice.currency} />

        {/* Notes */}
        {invoice.notes ? (
          <AppCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{invoice.notes}</Text>
          </AppCard>
        ) : null}

        {/* Status Actions */}
        <AppCard style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>UPDATE STATUS</Text>
          <View style={styles.statusActions}>
            {Object.values(INVOICE_STATUS).filter((s) => s !== invoice.status).map((s) => (
              <TouchableOpacity key={s} onPress={() => handleStatusChange(s)}
                style={[styles.statusBtn, { borderColor: colors.border }]}>
                <Text style={[styles.statusBtnText, { color: colors.textSecondary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <AppButton title="Edit" icon="pencil" variant="outline" onPress={handleEdit} style={styles.actionBtn} />
          <AppButton title={generating ? 'Generating...' : 'PDF & Share'} icon="file-pdf-box" onPress={handleGeneratePdf} loading={generating} style={styles.actionBtn} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} onConfirm={handleDelete}
        title="Delete Invoice" message={`Delete invoice ${invoice.invoice_number}? This cannot be undone.`} confirmLabel="Delete" destructive />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: spacing.base },
  invoiceHeader: { marginBottom: spacing.base },
  invoiceHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.base },
  invoiceNumber: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  invoiceDate: { fontSize: 13 },
  totalContainer: { borderRadius: borderRadius.md, padding: spacing.base, alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  section: { marginBottom: spacing.md },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, textTransform: 'uppercase' },
  customerName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  customerDetail: { fontSize: 13, lineHeight: 20 },
  lineItem: { paddingVertical: spacing.md },
  lineItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineItemName: { fontSize: 14, fontWeight: '500', flex: 1 },
  lineItemAmount: { fontSize: 14, fontWeight: '600' },
  lineItemMeta: { fontSize: 12 },
  notesText: { fontSize: 13, lineHeight: 20 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1 },
  statusBtnText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionBtn: { flex: 1 },
});

export default InvoiceDetailScreen;
