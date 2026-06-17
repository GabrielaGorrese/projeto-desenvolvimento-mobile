import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, typography } from '../theme';

export default function FiltersSheet({ visible, onClose, onClear, sections = [], size = 'md' }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / 375;

  const isLarge = size === 'lg';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              paddingHorizontal: 26 * scale,
              paddingTop: 10 * scale,
              borderTopLeftRadius: 22 * scale,
              borderTopRightRadius: 22 * scale,
              paddingBottom: insets.bottom + (isLarge ? 28 * scale : 20 * scale),
              maxHeight: isLarge ? '88%' : '85%',
            },
          ]}
          onPress={() => {}}
        >
          <View
            style={[
              styles.handle,
              {
                width: 54 * scale,
                height: 6 * scale,
                borderRadius: 3 * scale,
                marginVertical: 10 * scale,
              },
            ]}
          />

          <View
            style={[
              styles.header,
              {
                marginBottom: 16 * scale,
                paddingHorizontal: 24 * scale,
                minHeight: 54 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: (isLarge ? 30 : 24) * scale,
                  lineHeight: (isLarge ? 38 : 31) * scale,
                },
              ]}
            >
              Filtros
            </Text>

            <View style={{ flex: 1 }} />

            {onClear ? (
              <Pressable
                onPress={onClear}
                hitSlop={8}
                style={{
                  paddingHorizontal: 14 * scale,
                  paddingVertical: 10 * scale,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '700',
                    fontSize: (isLarge ? 24 : 20) * scale,
                    lineHeight: (isLarge ? 31 : 26) * scale,
                    marginRight: 8 * scale,
                  }}
                >
                  Limpar
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{ padding: 8 * scale, marginLeft: 4 * scale }}
            >
              <Feather
                name="x"
                size={(isLarge ? 38 : 32) * scale}
                color={colors.textDark}
              />
            </Pressable>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: '#ccc',
              width: '100%',
              marginVertical: 10 * scale,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24 * scale,
              paddingBottom: isLarge ? 12 * scale : 8 * scale,
            }}
          >
            {sections.map((sec) => (
              <View
                key={sec.key}
                style={{
                  marginTop: 18 * scale,
                  marginBottom: 10 * scale,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      fontSize: (isLarge ? 26 : 22) * scale,
                      lineHeight: (isLarge ? 34 : 29) * scale,
                      marginBottom: 12 * scale,
                    },
                  ]}
                >
                  {sec.title}
                </Text>

                <View style={styles.chipsRow}>
                  {sec.options.map((opt) => {
                    const active = sec.value === opt.value;
                    return (
                      <Pressable
                        key={String(opt.value ?? 'null')}
                        onPress={() => sec.onChange(opt.value)}
                        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                        style={[
                          styles.chip,
                          {
                            minHeight: (isLarge ? 60 : 50) * scale,
                            paddingHorizontal: (isLarge ? 22 : 18) * scale,
                            paddingVertical: (isLarge ? 15 : 12) * scale,
                            borderRadius: radii.md * scale,
                            marginRight: (isLarge ? 12 : 10) * scale,
                            marginBottom: (isLarge ? 12 : 10) * scale,
                          },
                          active && {
                            backgroundColor: opt.color || colors.primary,
                            borderColor: opt.color || colors.primary,
                          },
                        ]}
                      >
                        {opt.dot ? (
                          <View
                            style={{
                              width: (isLarge ? 16 : 13) * scale,
                              height: (isLarge ? 16 : 13) * scale,
                              borderRadius: (isLarge ? 8 : 7) * scale,
                              marginRight: (isLarge ? 12 : 10) * scale,
                              backgroundColor: opt.dot,
                            }}
                          />
                        ) : null}

                        <Text
                          style={[
                            {
                              color: colors.textDark,
                              fontSize: (isLarge ? 23 : 19) * scale,
                              lineHeight: (isLarge ? 30 : 25) * scale,
                            },
                            active && { color: '#FFF', fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D6D2CD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textDark,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.textDark,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
});