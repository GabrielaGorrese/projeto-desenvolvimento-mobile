import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Logo from '../components/Logo';
import { colors } from '../theme';
import GradientView from '../components/GradientView';
import { gradients } from '../theme/colors';

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
    <GradientView colors={gradients.ui.dark} style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />
      <Logo size="lg" subtitle="" />
    </GradientView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
