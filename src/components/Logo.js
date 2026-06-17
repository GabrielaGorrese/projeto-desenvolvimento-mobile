import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { colors } from '../theme';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function Logo({ size = 'lg', subtitle = 'Boas-vindas!' }) {
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);

  const baseFontSize = size === 'lg' ? 38 : size === 'md' ? 28 : 22;
  const baseSubtitleSize = size === 'lg' ? 24 : size === 'md' ? 20 : 16;

  const logoWidth = Math.round(Math.max(180, Math.min(500, minSide * 0.6)));
  const logoHeight = Math.round(logoWidth * 0.36); // mantém proporção aproximada (500x180)

  const subtitleFontSize = Math.round(
    Math.max(14, Math.min(26, baseSubtitleSize * (minSide / REF_MIN_SIDE)))
  );

  const subtitleMarginTop = scaleSize(6, minSide);
  const subtitlePaddingBottom = scaleSize(36, minSide);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Image
          source={require('../../assets/logo.png')}
          style={{
            width: logoWidth,
            height: logoHeight,
          }}
          resizeMode="contain"
        />
      </View>

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: subtitleFontSize,
              marginTop: subtitleMarginTop,
              paddingBottom: subtitlePaddingBottom,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});