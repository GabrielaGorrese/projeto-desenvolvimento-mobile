import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function BottomNavigation({
  activeTab = 'home',
  onTabPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <TabButton
        icon="home"
        isActive={activeTab === 'home'}
        onPress={() => onTabPress?.('home')}
      />
      <TabButton
        icon="document-text-outline"
        isActive={activeTab === 'orders'}
        onPress={() => onTabPress?.('orders')}
      />
      <TabButton
        icon="notifications-outline"
        isActive={activeTab === 'notifications'}
        onPress={() => onTabPress?.('notifications')}
      />
    </View>
  );
}

function TabButton({ icon, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Ionicons
        name={icon}
        size={24}
        color={isActive ? colors.accent : colors.placeholder}
      />
      {isActive && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 56,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  tab: {
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 10,
    height: 5,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
});
