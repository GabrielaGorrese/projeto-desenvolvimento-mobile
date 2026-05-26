import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Logo from '../components/Logo';
import { colors } from '../theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        navigation.replace('RoleSelect');
      } catch (e) {
        console.warn('[Splash] replace falhou', e);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />
      <Logo size="lg" subtitle="" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
