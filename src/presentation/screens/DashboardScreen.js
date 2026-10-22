/**
 * DashboardScreen - Business analytics and profit tracking
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { moderateScale, moderateFontScale } from '../../utils/responsive';
import { useSettingsStore } from '../../store/useSettingsStore';
import InvoiceRepository from '../../data/repositories/InvoiceRepository';
import { formatCurrency } from '../../utils/formatters';
import AppCard from '../components/common/AppCard';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, subValue, colors }) => (
  <AppCard style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statTitle, { color: colors.textTertiary }]}>{title}</Text>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    {subValue && <Text style={[styles.statSub, { color: colors.success }]}>{subValue}</Text>}
  </AppCard>
);

const DashboardScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const defaultCurrency = useSettingsStore((s) => s.default_currency);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await InvoiceRepository.getProfitStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const isGrowthPositive = stats?.monthlyGrowth >= 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Performance Hub</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('AnalyticsInfo')} style={styles.backBtn}>
            <Icon name="information-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
            <Icon name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Main Profit Card */}
        <AppCard style={[styles.mainCard, { backgroundColor: colors.primary }]}>
          <View style={styles.mainCardHeader}>
            <Text style={styles.mainCardLabel}>Net Business Profit</Text>
            <View style={styles.profitBadge}>
              <Icon name={isGrowthPositive ? "trending-up" : "trending-down"} size={14} color={isGrowthPositive ? colors.success : colors.error} />
              <Text style={[styles.profitBadgeText, { color: isGrowthPositive ? colors.success : colors.error }]}>
                {isGrowthPositive ? '+' : ''}{stats?.monthlyGrowth || 0}% this month
              </Text>
            </View>
          </View>
          <Text style={styles.mainProfitValue}>
            {formatCurrency(stats?.netProfit || 0, defaultCurrency)}
          </Text>
          <View style={styles.mainCardFooter}>
            <View style={styles.footerStat}>
              <Text style={styles.footerLabel}>Sales Count</Text>
              <Text style={styles.footerValue}>{stats?.totalSalesCount || 0}</Text>
            </View>
            <View style={[styles.footerDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.footerStat}>
              <Text style={styles.footerLabel}>Avg. Deal Size</Text>
              <Text style={styles.footerValue}>{formatCurrency(stats?.averageInvoiceValue || 0, defaultCurrency)}</Text>
            </View>
          </View>
        </AppCard>

        {/* Detailed Inventory Link */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('InventoryReport')}
          activeOpacity={0.7}
          style={{ marginBottom: spacing.lg }}
        >
          <AppCard style={[styles.insightsLink, { borderColor: colors.primary + '30', borderWidth: 1 }]}>
            <View style={[styles.insightsIcon, { backgroundColor: colors.primary + '15' }]}>
               <Icon name="chart-box-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
               <Text style={[styles.insightsTitle, { color: colors.textPrimary }]}>Detailed Stock Insights</Text>
               <Text style={[styles.insightsSub, { color: colors.textSecondary }]}>View investment, batches, and shelf value</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </AppCard>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Cash Flow Analysis</Text>
        
        <View style={styles.statsGrid}>
          <StatCard 
            title="Revenue" 
            value={formatCurrency(stats?.totalRevenue || 0, defaultCurrency)} 
            icon="currency-usd" 
            color={colors.primary} 
            colors={colors}
          />
          <StatCard 
            title="Investment" 
            value={formatCurrency(stats?.totalInvestment || 0, defaultCurrency)} 
            icon="wallet-outline" 
            color={colors.error} 
            colors={colors}
          />
        </View>

        {/* Receivables Row */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Pending Cash" 
            value={formatCurrency(stats?.pendingAmount || 0, defaultCurrency)} 
            icon="clock-outline" 
            color={colors.warning} 
            colors={colors}
          />
          <StatCard 
            title="Overdue" 
            value={formatCurrency(stats?.overdueAmount || 0, defaultCurrency)} 
            icon="alert-circle-outline" 
            color={colors.error} 
            colors={colors}
          />
        </View>

        {settings.enable_tax && stats?.totalTax > 0 && (
          <AppCard style={styles.taxSummaryCard}>
             <View style={styles.taxInfo}>
                <Icon name="bank-outline" size={24} color={colors.warning} />
                <View>
                  <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>Total Tax Collected</Text>
                  <Text style={[styles.taxValue, { color: colors.textPrimary }]}>{formatCurrency(stats?.totalTax || 0, defaultCurrency)}</Text>
                </View>
             </View>
          </AppCard>
        )}

        {/* Monthly Comparison */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.lg }]}>Monthly Comparison</Text>
        <AppCard style={styles.growthCard}>
           <View style={styles.comparisonRow}>
              <View>
                <Text style={[styles.comparisonLabel, { color: colors.textTertiary }]}>Last Month</Text>
                <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>{formatCurrency(stats?.lastMonthRevenue || 0, defaultCurrency)}</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.border} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.comparisonLabel, { color: colors.textTertiary }]}>This Month</Text>
                <Text style={[styles.comparisonValue, { color: colors.primary }]}>{formatCurrency(stats?.thisMonthRevenue || 0, defaultCurrency)}</Text>
              </View>
           </View>
        </AppCard>

        {/* Top Selling Items */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.lg }]}>Top Performing Items</Text>
        <AppCard style={styles.listCard}>
          {stats?.topItems && stats.topItems.length > 0 ? stats.topItems.map((item, idx) => (
            <View key={idx} style={[styles.listItem, idx < stats.topItems.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
              <View style={styles.listItemIcon}>
                <Text style={[styles.itemRank, { color: colors.primary }]}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemSub, { color: colors.textTertiary }]}>{item.total_qty} units sold</Text>
              </View>
              <Text style={[styles.itemValue, { color: colors.textPrimary }]}>{formatCurrency(item.total_revenue, defaultCurrency)}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No items sold yet</Text>}
        </AppCard>

        {/* Top Customers */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.lg }]}>Top Revenue Customers</Text>
        <AppCard style={styles.listCard}>
          {stats?.topCustomers && stats.topCustomers.length > 0 ? stats.topCustomers.map((cust, idx) => (
            <View key={idx} style={[styles.listItem, idx < stats.topCustomers.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
              <View style={[styles.listItemIcon, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="account" size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{cust.customer_name}</Text>
                <Text style={[styles.itemSub, { color: colors.textTertiary }]}>{cust.invoice_count} invoices</Text>
              </View>
              <Text style={[styles.itemValue, { color: colors.success }]}>{formatCurrency(cust.total_spent, defaultCurrency)}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No customer data available</Text>}
        </AppCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: spacing.base },
  
  mainCard: { padding: spacing.xl, marginBottom: spacing.lg, borderRadius: borderRadius.xl },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  mainCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  profitBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  profitBadgeText: { fontSize: 12, fontWeight: '700' },
  mainProfitValue: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: spacing.sm },
  mainCardFooter: { flexDirection: 'row', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  footerStat: { flex: 1 },
  footerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  footerValue: { color: '#FFF', fontSize: 16, fontWeight: '600', marginTop: 2 },
  footerDivider: { width: 1, height: '100%', marginHorizontal: spacing.md },

  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  statTitle: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statSub: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  taxSummaryCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  taxInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taxLabel: { fontSize: 12, fontWeight: '500' },
  taxValue: { fontSize: 18, fontWeight: '700' },

  growthCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comparisonLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  comparisonValue: { fontSize: 16, fontWeight: '700' },

  insightsLink: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, borderRadius: borderRadius.lg },
  insightsIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  insightsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  insightsSub: { fontSize: 11 },

  listCard: { padding: spacing.sm, borderRadius: borderRadius.lg },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  listItemIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  itemRank: { fontSize: 16, fontWeight: '800' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 11, marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: '700' },
  emptyText: { padding: spacing.xl, textAlign: 'center', color: '#999', fontSize: 13 },

  infoBox: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginBottom: spacing.lg },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  tipCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tipTitle: { fontSize: 15, fontWeight: '700' },
  tipText: { fontSize: 13, lineHeight: 20 },
});

export default DashboardScreen;
