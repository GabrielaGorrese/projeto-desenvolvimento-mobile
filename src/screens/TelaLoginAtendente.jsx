import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginTopSection from '../components/LoginTopSection';
import LoginFormCard from '../components/LoginFormCard';
import FormTextField from '../components/FormTextField';
import LoginPrimaryButton from '../components/LoginPrimaryButton';
import LoginSecondaryButton from '../components/LoginSecondaryButton';
import LoginScreenFooter from '../components/LoginScreenFooter';
import { colors } from '../theme/colors';
import { loginLayout } from '../theme/loginLayout';

export default function TelaLoginAtendente({ navigation, route }) {
  const roleParam = route?.params?.role;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Tables');
    }, 400);
  };

  const handleRegister = () => {
    console.log('Cadastrar atendente');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <LoginTopSection />

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LoginFormCard
          role={roleParam === 'manager' ? 'GERENTE' : 'ATENDENTE'}
          onBackPress={() => navigation?.goBack()}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <FormTextField
              label="Usuário"
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu usuário"
              autoCapitalize="none"
            />

            <FormTextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              secureTextEntry
              style={styles.passwordField}
            />

            <LoginPrimaryButton
              onPress={handleLogin}
              loading={loading}
              disabled={!username.trim() || !password.trim()}
              style={styles.enterButton}
            />

            <View style={styles.registerButtonWrap}>
              <LoginSecondaryButton onPress={handleRegister} />
            </View>

            <View style={styles.footerWrap}>
              <LoginScreenFooter />
            </View>
          </ScrollView>
        </LoginFormCard>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.headerStart,
  },
  formArea: {
    flex: 1,
    backgroundColor: colors.loginCard,
  },
  formScroll: {
    flexGrow: 1,
    paddingBottom: loginLayout.formPaddingTop,
  },
  passwordField: {
    marginTop: loginLayout.fieldGap,
  },
  enterButton: {
    marginTop: loginLayout.beforeEnterGap,
  },
  registerButtonWrap: {
    marginTop: loginLayout.beforeRegisterGap,
    alignItems: 'center',
  },
  footerWrap: {
    marginTop: loginLayout.beforeFooterGap,
    alignItems: 'center',
  },
});
