import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { loginLayout, scaleH, scaleW } from '../theme/loginLayout';


export default function LoginTopSection({ welcomeText = 'Boas-vindas!' }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerStart, colors.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          height: loginLayout.topSectionHeight + insets.top,
          paddingTop: insets.top + scaleH(61),
        },
      ]}
    >
      <View style={styles.logoPlaceholder}>
        <Image
          source={require('../assets/comandouLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.welcome}>{welcomeText}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: scaleW(39),
  },
  logoPlaceholder: {
    width: loginLayout.logoWidth,
    minHeight: loginLayout.logoHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: loginLayout.logoWidth,
    height: loginLayout.logoHeight,
  },
  welcome: {
    marginTop: loginLayout.welcomeMarginTop,
    fontSize: scaleW(16),
    fontWeight: '600',
    lineHeight: scaleH(21),
    color: colors.white,
    textAlign: 'center',
    width: scaleW(269),
  },
});
