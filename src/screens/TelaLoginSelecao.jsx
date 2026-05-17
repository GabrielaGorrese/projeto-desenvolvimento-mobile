import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginTopSection from '../components/LoginTopSection';
import LoginSelectionPanel from '../components/LoginSelectionPanel';
import RoleSelectionPrompt from '../components/RoleSelectionPrompt';
import RoleSelectionCard from '../components/RoleSelectionCard';
import LoginScreenFooter from '../components/LoginScreenFooter';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function TelaLoginSelecao({ navigation }) {
  const handleSelectRole = (role) => {
    navigation.navigate('Login', { role: role.toLowerCase() });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <LoginTopSection />

      <LoginSelectionPanel>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <RoleSelectionPrompt />

          <View style={styles.cards}>
            <RoleSelectionCard
              role="ATENDENTE"
              onPress={() => handleSelectRole('attendant')}
            />
            <RoleSelectionCard
              role="GERENTE"
              onPress={() => handleSelectRole('manager')}
            />
          </View>

          <View style={styles.footerWrap}>
            <LoginScreenFooter />
          </View>
        </ScrollView>
      </LoginSelectionPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.headerStart,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: loginLayout.formPaddingTop,
  },
  cards: {
    marginTop: loginLayout.selectionCardsMarginTop - loginLayout.formPaddingTop,
    gap: loginLayout.roleCardGap,
    paddingHorizontal: 0,
  },
  footerWrap: {
    marginTop: loginLayout.beforeFooterGap,
    alignItems: 'center',
  },
});
