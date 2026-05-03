import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, 
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { useSettingsStore } from '../../store/useSettingsStore';
import SecurityService from '../../services/SecurityService';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { moderateScale, moderateFontScale } from '../../utils/responsive';

const ActivationScreen = () => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const [productKey, setProductKey] = useState('');
  const [loading, setLoading] = useState(false);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const handleActivate = async () => {
    if (!productKey.trim()) {
      Alert.alert('Required', 'Please enter your product activation key.');
      return;
    }

    setLoading(true);
    try {
      const success = await SecurityService.activateProduct(productKey);
      if (success) {
        await updateSettings({ is_activated: true });
        Alert.alert('Success!', 'Your copy of Invox has been successfully activated.');
      }
    } catch (error) {
      Alert.alert('Activation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Icon name="shield-check" size={moderateScale(60)} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Activation Required
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please enter your unique product key to start using Invox. Each key is valid for a single device.
          </Text>

          <View style={styles.inputSection}>
            <AppInput
              label="Product Key"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={productKey}
              onChangeText={setProductKey}
              autoCapitalize="characters"
              leftIcon="key-variant"
            />
            
            <AppButton
              title="Activate Now"
              icon="lightning-bolt"
              onPress={handleActivate}
              loading={loading}
              fullWidth
              style={styles.button}
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="information-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              Don't have a key? Please contact your administrator or provider to purchase an activation license.
            </Text>
          </View>
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Invox Professional v1.0.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...elevation.md,
  },
  title: {
    fontSize: moderateFontScale(28),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: moderateFontScale(15),
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  inputSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: moderateFontScale(12),
    lineHeight: 18,
  },
  footerText: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default ActivationScreen;
