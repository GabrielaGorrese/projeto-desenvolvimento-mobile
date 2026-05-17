import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export default function OrderHeader({ title, subtitle, onBackPress }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerStart, colors.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    marginTop: 4,
    padding: 4,
  },
  textBlock: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: colors.placeholder,
    marginTop: 6,
    lineHeight: 15,
  },
});
