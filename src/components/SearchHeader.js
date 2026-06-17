import React from 'react';
import { View, TextInput, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

import BaseHeader from './BaseHeader';
import { colors, radii } from '../theme';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

export default function SearchHeader({
  onBack,
  value,
  onChangeText,
  onSubmit,
  onFilter,
  activeFilters = 0,
  placeholder = 'Nº da comanda, atendente ou identificação...',
}) {
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);

  const backSize = Math.round(Math.max(56, Math.min(96, minSide * 0.085)));
  const iconSize = Math.round(Math.max(20, Math.min(42, minSide * 0.05)));

  const searchHeight = Math.round(Math.max(56, Math.min(96, minSide * 0.085)));
  const searchRadius = Math.round(Math.max(10, Math.min(20, minSide * 0.02)));
  const searchPaddingH = scaleSize(22, minSide);
  const inputFontSize = Math.round(Math.max(14, Math.min(24, minSide * 0.028)));
  const inputLineHeight = Math.round(inputFontSize * 1.25);
  const inputMarginLeft = scaleSize(12, minSide);

  const filterSize = searchHeight;
  const filterRadius = searchRadius;
  const filterMarginRight = scaleSize(12, minSide);

  const badgeSize = Math.round(Math.max(18, Math.min(28, minSide * 0.03)));
  const badgeOffset = scaleSize(4, minSide);
  const badgePaddingH = scaleSize(6, minSide);
  const badgeFontSize = Math.round(Math.max(10, Math.min(14, minSide * 0.016)));

  return (
    <BaseHeader
      left={
        onBack ? (
          <Pressable
            onPress={onBack}
            style={{
              width: backSize,
              height: backSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="arrow-left" size={iconSize} color="#FFF" />
          </Pressable>
        ) : null
      }
      center={
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bgDarkSoft,
            borderRadius: searchRadius,
            paddingHorizontal: searchPaddingH,
            height: searchHeight,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Feather name="search" size={Math.round(iconSize * 0.7)} color={colors.textMuted} />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            style={{
              flex: 1,
              color: '#FFF',
              fontSize: inputFontSize,
              lineHeight: inputLineHeight,
              marginLeft: inputMarginLeft,
            }}
          />
        </View>
      }
      right={
        onFilter && (
          <Pressable
            onPress={onFilter}
            style={{
              width: filterSize,
              height: filterSize,
              borderRadius: filterRadius,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: filterMarginRight,
            }}
          >
            <Feather name="sliders" size={Math.round(iconSize * 0.75)} color="#FFF" />

            {activeFilters > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -badgeOffset,
                  right: -badgeOffset,
                  backgroundColor: colors.danger,
                  borderRadius: badgeSize / 2,
                  minWidth: badgeSize,
                  height: badgeSize,
                  paddingHorizontal: badgePaddingH,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: badgeFontSize,
                    fontWeight: 'bold',
                  }}
                >
                  {activeFilters}
                </Text>
              </View>
            )}
          </Pressable>
        )
      }
    />
  );
}

const styles = StyleSheet.create({});