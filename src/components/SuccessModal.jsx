import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ModalOverlay from './ModalOverlay';
import { colors } from '../theme/colors';

export default function SuccessModal({
  visible,
  title = 'Pedido cadastrado',
  orderNumber,
  message,
  onConfirm,
}) {
  if (!visible) {
    return null;
  }

  const defaultMessage = (
    <Text style={styles.message}>
      Pedido <Text style={styles.messageBold}>n° {orderNumber}</Text>
      {'\n'}cadastrado com sucesso!
    </Text>
  );

  return (
    <View style={styles.container}>
      <ModalOverlay onPress={onConfirm} />

      <View style={styles.card}>
        <LinearGradient
          colors={[colors.accent, colors.modalHeaderEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.title}>{title}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={24} color={colors.modalMessage} />
          </View>

          {message || defaultMessage}

          <TouchableOpacity
            style={styles.button}
            onPress={onConfirm}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 38,
  },
  card: {
    width: '100%',
    maxWidth: 336,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 2,
  },
  header: {
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.modalIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.modalMessage,
    textAlign: 'center',
    marginBottom: 24,
  },
  messageBold: {
    fontWeight: '700',
    color: colors.modalMessage,
  },
  button: {
    backgroundColor: colors.modalHeaderEnd,
    borderRadius: 8,
    height: 32,
    minWidth: 116,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});
