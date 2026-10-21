/**
 * AnalyticsInfoScreen - Educational guide for business intelligence features
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import AppCard from '../components/common/AppCard';

const HelpSection = ({ title, icon, color, description, points, colors }) => (
  <AppCard style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
    </View>
    <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
    {points.map((point, idx) => (
      <View key={idx} style={styles.pointRow}>
        <Icon name="check-circle-outline" size={16} color={colors.success} style={{ marginTop: 2 }} />
        <Text style={[styles.pointText, { color: colors.textSecondary }]}>{point}</Text>
      </View>
    ))}
  </AppCard>
);

const AnalyticsInfoScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Intelligence Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          Understand how Invox analyzes your business performance and inventory value.
        </Text>

        <HelpSection 
          title="Net Profit & Revenue"
          icon="trending-up"
          color={colors.success}
          colors={colors}
          description="We don't just show you sales; we show you real earnings."
          points={[
            "Revenue is the total amount from all Sent, Paid, and Overdue invoices.",
            "Net Profit is Revenue minus the Actual Purchase Cost of those items.",
            "This gives you a real-world view of your business growth."
          ]}
        />

        <HelpSection 
          title="Receivables Tracking"
          icon="cash-clock"
          color={colors.warning}
          colors={colors}
          description="Keep track of money that is currently owed to you."
          points={[
            "Pending: Money from 'Sent' invoices that hasn't been collected yet.",
            "Overdue: Money from invoices past their due date.",
            "Average Deal Size: The typical value of a single sale in your business."
          ]}
        />

        <HelpSection 
          title="Inventory Intelligence"
          icon="package-variant-closed"
          color={colors.primary}
          colors={colors}
          description="Real-time valuation of your warehouse and shelves."
          points={[
            "Shelf Value: The current cost value of all items in your stock.",
            "Potential Revenue: The total money you will make if you sell all current stock.",
            "Low Stock Alerts: Visual warnings when items drop below your set limit."
          ]}
        />

        <HelpSection 
          title="Automated Guards"
          icon="shield-check-outline"
          color={colors.secondary}
          colors={colors}
          description="Built-in protection for your business data."
          points={[
            "Auto-Deduction: Stock is instantly subtracted when an invoice is sent or paid.",
            "Restock Logic: If you delete or cancel an invoice, stock returns automatically.",
            "Zero-Stock Guard: You cannot sell items that are out of stock."
          ]}
        />

        <View style={[styles.footerInfo, { backgroundColor: colors.surfaceVariant }]}>
           <Icon name="information-outline" size={20} color={colors.textTertiary} />
           <Text style={[styles.footerText, { color: colors.textSecondary }]}>
             All calculations are performed locally and securely on your device.
           </Text>
        </View>

        <View style={{ height: 40 }} />
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
  introText: { fontSize: 14, marginBottom: spacing.lg, lineHeight: 20, paddingHorizontal: 4 },

  sectionCard: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.md, ...elevation.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  pointRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  pointText: { flex: 1, fontSize: 12, lineHeight: 18 },

  footerInfo: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm, marginTop: spacing.md },
  footerText: { flex: 1, fontSize: 11 },
});

export default AnalyticsInfoScreen;
