import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { loginLayout, scaleH } from '../theme/loginLayout';

export default function RoleSelectionPrompt({
  text = 'Quem está tentando acessar?',
}) {
  return <Text style={styles.prompt}>{text}</Text>;
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: loginLayout.labelFontSize,
    fontWeight: '600',
    lineHeight: scaleH(24),
    color: colors.sectionTitle,
    textAlign: 'center',
    width: loginLayout.roleCardWidth,
    alignSelf: 'center',
    marginTop: loginLayout.selectionPromptMarginTop,
    marginBottom: scaleH(4),
  },
});
