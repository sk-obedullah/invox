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
import InvoiceRepository from '../../data/repositories/InvoiceRepository';
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
  const [revisions, setRevisions] = useState([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchHistory = useCallback(async () => {
    const revs = await InvoiceRepository.getRevisions(invoiceId);
    setRevisions(revs);
  }, [invoiceId]);

  useEffect(() => { 
    fetchInvoiceById(invoiceId);
    fetchHistory();
  }, [invoiceId]);

  const handleEdit = useCallback(() => {
    navigation.navigate('CreateInvoice', { invoiceId });
  }, [invoiceId, navigation]);

  const handleDelete = useCallback(async () => {
    setDeleteDialogVisible(false);
    try {
      await deleteInvoice(invoiceId);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete invoice');
    }
  }, [invoiceId, deleteInvoice, navigation]);

  const handleStatusChange = useCallback(async (status) => {
    await updateInvoiceStatus(invoiceId, status);
    fetchInvoiceById(invoiceId);
    fetchHistory();
  }, [invoiceId, fetchHistory]);

  const handleGeneratePdf = useCallback(async () => {
    if (!invoice) return;
    setGenerating(true);
    try {
      const fullInvoice = await fetchInvoiceById(invoiceId);
      if (fullInvoice) {
        const pdfPath = await PdfService.generateInvoicePdf(fullInvoice, settings);
        await ShareService.sharePdf(pdfPath, fullInvoice.invoice_number);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      Alert.alert('Error', 'Could not generate or share PDF');
    } finally {
      setGenerating(false);
    }
  }, [invoice, invoiceId, fetchInvoiceById, settings]);

  if (isLoading || !invoice) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isArchived = route.params?.isArchived;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isArchived ? 'Archived Invoice' : 'Invoice Details'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          {/* Main Info Card */}
          <AppCard style={styles.section}>
            <View style={styles.topRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[styles.invNumber, { color: colors.primary }]}>#{invoice.invoice_number}</Text>
                <Text style={[styles.date, { color: colors.textTertiary }]}>Issued: {formatDate(invoice.issue_date, 'DD MMM, YYYY')}</Text>
                {invoice.due_date && (
                  <Text style={[styles.date, { color: colors.textTertiary, marginTop: 2 }]}>
                    Due: {formatDate(invoice.due_date, 'DD MMM, YYYY')}
                  </Text>
                )}
              </View>
              <StatusBadge status={invoice.status} />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.customerInfo}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CUSTOMER</Text>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>{invoice.customer_name}</Text>
              {invoice.customer_email && <Text style={[styles.customerSub, { color: colors.textSecondary }]}>{invoice.customer_email}</Text>}
              {invoice.customer_address && <Text style={[styles.customerSub, { color: colors.textSecondary, marginTop: 4 }]}>{invoice.customer_address}</Text>}
            </View>
          </AppCard>

          {/* Items Card */}
          <AppCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ITEMS</Text>
            {(invoice.line_items || []).map((item, i) => (
              <View key={i} style={[styles.lineItem, i < invoice.line_items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
                <View style={styles.lineItemTop}>
                  <Text style={[styles.lineItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.lineItemAmount, { color: colors.textPrimary }]}>{formatCurrency(item.total || item.amount || 0, invoice.currency)}</Text>
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
        <View style={{ marginVertical: spacing.md }}>
          <InvoiceSummary 
            totals={{
              subtotal: invoice.subtotal,
              tax_amount: invoice.tax_amount,
              discount: invoice.discount,
              total: invoice.total
            }} 
            currency={invoice.currency} 
            showTax={settings.enable_tax} 
          />
        </View>

        {/* Document Timeline */}
        <AppCard style={styles.section}>
          <View style={styles.revisionHeader}>
            <Icon name="history" size={20} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginBottom: 0, fontSize: 13 }]}>Document Timeline</Text>
          </View>
          
          <View style={styles.timelineContainer}>
            {/* Version Nodes */}
            {revisions.map((rev, idx) => {
              const isStatusUpdate = rev.reason && rev.reason.includes('Status changed');
              const badgeText = isStatusUpdate ? 'STATUS UPDATE' : 'DOCUMENT EDITED';
              const badgeColor = isStatusUpdate ? colors.warning : colors.primary;
              const badgeBg = isStatusUpdate ? colors.warningLight : colors.primaryLight;
              
              return (
                <View key={rev.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: badgeColor }]} />
                    <View style={[styles.timelineLine, { backgroundColor: colors.borderLight }]} />
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <View style={styles.revisionInfoRow}>
                      <View style={[styles.versionBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.versionText, { color: badgeColor }]}>{badgeText}</Text>
                      </View>
                      <Text style={[styles.revisionDate, { color: colors.textTertiary }]}>
                        {formatDate(rev.created_at, 'MMM DD, HH:mm')}
                      </Text>
                    </View>
                    <Text style={[styles.revisionReason, { color: colors.textSecondary }]}>
                      {rev.reason || 'Snapshot captured'}
                    </Text>
                  </View>
                </View>
              );
            })}
            
            {/* Original Creation Node - Always Visible */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success, transform: [{ scale: 0.8 }] }]} />
              </View>
              <View style={styles.timelineContent}>
                <View style={[styles.versionBadge, { backgroundColor: colors.successLight, alignSelf: 'flex-start', marginBottom: 4 }]}>
                  <Text style={[styles.versionText, { color: colors.success }]}>DOCUMENT CREATED</Text>
                </View>
                <Text style={[styles.revisionReason, { color: colors.textSecondary, fontSize: 12 }]}>Initial draft generated</Text>
                <Text style={[styles.revisionDate, { color: colors.textTertiary, marginTop: 2 }]}>
                  {formatDate(invoice.created_at, 'MMM DD, YYYY - HH:mm')}
                </Text>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Notes */}
        {invoice.notes ? (
          <AppCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{invoice.notes}</Text>
          </AppCard>
        ) : null}

        {/* Status Actions */}
        {!isArchived && (
          <AppCard style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>UPDATE STATUS</Text>
            <View style={styles.statusActions}>
              {Object.values(INVOICE_STATUS)
                .filter((s) => {
                  // Cannot move back to draft once it's been sent/finalized
                  if (s === INVOICE_STATUS.DRAFT) return false;
                  // Cannot move to current status
                  return s !== invoice.status;
                })
                .map((s) => (
                  <TouchableOpacity key={s} onPress={() => handleStatusChange(s)}
                    style={[styles.statusBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.statusBtnText, { color: colors.textSecondary }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </AppCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isArchived && invoice.status === INVOICE_STATUS.DRAFT && (
            <AppButton 
              title="Edit" 
              icon="pencil" 
              variant="outline" 
              onPress={handleEdit} 
              style={styles.actionBtn} 
            />
          )}
          <AppButton 
            title={generating ? 'Generating...' : 'Share PDF'} 
            icon="share-variant-outline" 
            onPress={handleGeneratePdf} 
            loading={generating} 
            style={styles.actionBtn} 
          />
        </View>

        <View style={{ height: 100 }} />
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
  section: { marginBottom: spacing.md, padding: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md, textTransform: 'uppercase' },
  
  // Header Info Styles
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  invNumber: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  date: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginVertical: spacing.lg, opacity: 0.5 },
  
  // Customer Styles
  customerInfo: { marginTop: spacing.sm },
  customerName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  customerSub: { fontSize: 14, lineHeight: 20 },
  
  // Line Items
  lineItem: { paddingVertical: spacing.md },
  lineItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineItemName: { fontSize: 15, fontWeight: '600', flex: 1 },
  lineItemAmount: { fontSize: 15, fontWeight: '700' },
  lineItemMeta: { fontSize: 13 },
  
  notesText: { fontSize: 14, lineHeight: 22 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, backgroundColor: 'transparent' },
  statusBtnText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  
  // Timeline Styles
  revisionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  timelineContainer: { paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  timelineLine: { width: 2, flex: 1, marginVertical: -5 },
  timelineContent: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.lg },
  revisionInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  versionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  versionText: { fontSize: 10, fontWeight: '900' },
  revisionDate: { fontSize: 11 },
  revisionReason: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionBtn: { flex: 1 },
});

export default InvoiceDetailScreen;
