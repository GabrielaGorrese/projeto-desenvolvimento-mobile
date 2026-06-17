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
  const scale = (width / 375) * 0.75;

  const isLarge = size === 'lg';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              paddingHorizontal: 18 * scale,
              paddingTop: 6 * scale,
              borderTopLeftRadius: 18 * scale,
              borderTopRightRadius: 18 * scale,
              paddingBottom: insets.bottom + (isLarge ? 16 * scale : 12 * scale),
              maxHeight: isLarge ? '55%' : '50%',
            },
          ]}
          onPress={() => {}}
        >
          <View
            style={[
              styles.handle,
              {
                width: 40 * scale,
                height: 4 * scale,
                borderRadius: 2 * scale,
                marginVertical: 6 * scale,
              },
            ]}
          />

          <View
            style={[
              styles.header,
              {
                marginBottom: 10 * scale,
                paddingHorizontal: 12 * scale,
                minHeight: 36 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: (isLarge ? 22 : 18) * scale,
                  lineHeight: (isLarge ? 26 : 22) * scale,
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
                  paddingHorizontal: 8 * scale,
                  paddingVertical: 6 * scale,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '700',
                    fontSize: (isLarge ? 16 : 14) * scale,
                    lineHeight: (isLarge ? 20 : 18) * scale,
                    marginRight: 4 * scale,
                  }}
                >
                  Limpar
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{ padding: 4 * scale, marginLeft: 2 * scale }}
            >
              <Feather
                name="x"
                size={(isLarge ? 24 : 20) * scale}
                color={colors.textDark}
              />
            </Pressable>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: '#ccc',
              width: '100%',
              marginVertical: 6 * scale,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 12 * scale,
              paddingBottom: isLarge ? 8 * scale : 6 * scale,
            }}
          >
            {sections.map((sec) => (
              <View
                key={sec.key}
                style={{
                  marginTop: 10 * scale,
                  marginBottom: 6 * scale,
                }}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      fontSize: (isLarge ? 18 : 16) * scale,
                      lineHeight: (isLarge ? 22 : 20) * scale,
                      marginBottom: 6 * scale,
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
                            minHeight: (isLarge ? 40 : 34) * scale,
                            paddingHorizontal: (isLarge ? 14 : 12) * scale,
                            paddingVertical: (isLarge ? 10 : 8) * scale,
                            borderRadius: radii.md,
                            marginRight: (isLarge ? 8 : 6) * scale,
                            marginBottom: (isLarge ? 8 : 6) * scale,
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
                              width: (isLarge ? 10 : 8) * scale,
                              height: (isLarge ? 10 : 8) * scale,
                              borderRadius: (isLarge ? 5 : 4) * scale,
                              marginRight: (isLarge ? 6 : 5) * scale,
                              backgroundColor: opt.dot,
                            }}
                          />
                        ) : null}

                        <Text
                          style={[
                            {
                              color: colors.textDark,
                              fontSize: (isLarge ? 15 : 13) * scale,
                              lineHeight: (isLarge ? 18 : 16) * scale,
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