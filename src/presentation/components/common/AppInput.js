/**
 * AppInput - Reusable text input with label, error, and icon support
 * Integrates with React Hook Form via Controller
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';
import { moderateScale, moderateFontScale } from '../../../utils/responsive';

const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  editable = true,
  required = false,
  style,
  inputStyle,
  ...rest
}) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: error ? colors.error : colors.textSecondary }]}>
            {label}
          </Text>
          {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: editable ? colors.surface : colors.surfaceVariant,
            borderColor: borderColor,
          },
          multiline && { minHeight: 80, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isFocused ? colors.primary : colors.placeholder}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          editable={editable}
          style={[
            styles.input,
            { color: colors.textPrimary },
            multiline && { textAlignVertical: 'top', paddingTop: 12 },
            inputStyle,
          ]}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon
              name={rightIcon}
              size={20}
              color={colors.placeholder}
              style={styles.rightIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: moderateScale(spacing.base),
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(spacing.xs),
  },
  label: {
    fontSize: moderateFontScale(13),
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  required: {
    fontSize: moderateFontScale(13),
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: moderateScale(spacing.md),
  },
  input: {
    flex: 1,
    fontSize: moderateFontScale(15),
    paddingVertical: moderateScale(12),
    fontWeight: '400',
  },
  leftIcon: {
    marginRight: moderateScale(spacing.sm),
  },
  rightIcon: {
    marginLeft: moderateScale(spacing.sm),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  errorText: {
    fontSize: moderateFontScale(12),
    marginLeft: 4,
    fontWeight: '400',
  },
  helperText: {
    fontSize: moderateFontScale(12),
    marginTop: moderateScale(4),
  },
});

export default React.memo(AppInput);
