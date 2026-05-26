import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';


export default function DarkHeader({ title, subtitle, onBack, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 14 }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={styles.back}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 18 }}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </Pressable>
        ) : <View style={styles.back} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  row:  { flexDirection: 'row', alignItems: 'center' },
  back: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  title:    { ...typography.title, color: '#FFF', fontSize: 18 },
  subtitle: { color: '#C0C0C0', fontSize: 12, marginTop: 2 },
});
