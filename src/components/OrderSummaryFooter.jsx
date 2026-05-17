import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

function formatPrice(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export default function OrderSummaryFooter({
  total,
  totalPerPerson,
  actionLabel = 'Abrir comanda',
  onActionPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <LinearGradient
        colors={[colors.footerGradientStart, colors.footerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.perPersonBlock}>
            <Text style={styles.perPersonLabel}>Total por pessoa:</Text>
            <Text style={styles.perPersonValue}>{formatPrice(totalPerPerson)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  summaryGradient: {
    marginHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    lineHeight: 38,
  },
  perPersonBlock: {
    alignItems: 'flex-end',
  },
  perPersonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  perPersonValue: {
    fontSize: 12,
    color: colors.placeholder,
    textAlign: 'right',
  },
  actionContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginHorizontal: 16,
    paddingHorizontal: 27,
    paddingVertical: 16,
    shadowColor: '#898989',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
