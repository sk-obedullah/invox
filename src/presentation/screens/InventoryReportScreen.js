/**
 * InventoryReportScreen - Comprehensive business valuation and inventory analytics
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { moderateScale, moderateFontScale } from '../../utils/responsive';
import { useSettingsStore } from '../../store/useSettingsStore';
import ItemRepository from '../../data/repositories/ItemRepository';
import { formatCurrency } from '../../utils/formatters';
import AppCard from '../components/common/AppCard';

const { width } = Dimensions.get('window');

const MetricCard = ({ title, value, icon, color, subText, colors }) => (
  <AppCard style={styles.metricCard}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.metricTitle, { color: colors.textTertiary }]}>{title}</Text>
    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    {subText && <Text style={[styles.metricSub, { color: colors.textTertiary }]}>{subText}</Text>}
  </AppCard>
);

const InventoryReportScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const defaultCurrency = settings.default_currency;
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const data = await ItemRepository.getInventoryReport();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Inventory Intelligence</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Icon name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Investment & Valuation Summary */}
        <AppCard style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={styles.summaryRow}>
             <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total All-Time Investment</Text>
                <Text style={styles.summaryValue}>{formatCurrency(report?.allTimeInvestment || 0, defaultCurrency)}</Text>
             </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
             <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Stock Left</Text>
                <Text style={styles.summaryValue}>{report?.stock?.total_items_left || 0} Items</Text>
             </View>
             <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Shelf Value</Text>
                <Text style={styles.summaryValue}>{formatCurrency(report?.stock?.current_investment_value || 0, defaultCurrency)}</Text>
             </View>
          </View>
        </AppCard>

        {/* Sales Performance Grid */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Sales Performance</Text>
        <View style={styles.metricsGrid}>
           <MetricCard 
              title="Items Sold"
              value={report?.sales?.total_items_sold || 0}
              icon="cart-outline"
              color={colors.primary}
              colors={colors}
              subText="Units dispatched"
           />
           <MetricCard 
              title="Gross Profit"
              value={formatCurrency(report?.sales?.estimated_profit || 0, defaultCurrency)}
              icon="trending-up"
              color={colors.success}
              colors={colors}
              subText="Net earnings"
           />
        </View>

        <View style={styles.metricsGrid}>
           <MetricCard 
              title="Sales Revenue"
              value={formatCurrency(report?.sales?.total_revenue || 0, defaultCurrency)}
              icon="cash-multiple"
              color={colors.secondary}
              colors={colors}
              subText="Total inflow"
           />
           <MetricCard 
              title="Potential Revenue"
              value={formatCurrency(report?.stock?.potential_revenue || 0, defaultCurrency)}
              icon="eye-outline"
              color={colors.warning}
              colors={colors}
              subText="Remaining stock value"
           />
        </View>

        {/* Intelligence Message */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
           <Icon name="lightbulb-outline" size={20} color={colors.primary} />
           <Text style={[styles.infoText, { color: colors.textSecondary }]}>
             <Text style={{ fontWeight: '700' }}>Pro Tip:</Text> Based on your current "Items Left" ({report?.stock?.total_items_left || 0}), you have enough stock to generate another <Text style={{ fontWeight: '700', color: colors.primary }}>{formatCurrency(report?.stock?.potential_revenue || 0, defaultCurrency)}</Text> in revenue.
           </Text>
        </View>

        {/* Footer Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: spacing.base },

  summaryCard: { padding: spacing.xl, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: spacing.md },

  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: 4 },
  metricsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  metricCard: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  metricTitle: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '700' },
  metricSub: { fontSize: 10, marginTop: 4 },

  infoBox: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginTop: spacing.md },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

export default InventoryReportScreen;
