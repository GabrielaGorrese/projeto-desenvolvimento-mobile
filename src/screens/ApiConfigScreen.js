import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Screen from '../components/Screen';
import DarkHeader from '../components/DarkHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii, typography } from '../theme';
import { getApiBaseUrl, setApiBaseUrl, normalizeBaseUrl } from '../services/apiConfig';
import { getShowTable, getShowLabel, setShowTable, setShowLabel } from '../services/appSettings';
import { reconnectSocket } from '../services/socket';

// Testa se o servidor responde, com timeout manual (o fetch do RN não tem timeout nativo).
async function pingServer(baseUrl, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // /api-docs sempre existe e não exige autenticação; qualquer resposta HTTP = servidor acessível.
    const res = await fetch(`${baseUrl}/api-docs`, { method: 'GET', signal: ctrl.signal });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function ApiConfigScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  // status: null | 'ok' | 'fail'
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Flags de campos opcionais da comanda
  const [showTable, setShowTableState] = useState(false);
  const [showLabel, setShowLabelState] = useState(false);

  useEffect(() => {
    setUrl(getApiBaseUrl());
    setShowTableState(getShowTable());
    setShowLabelState(getShowLabel());
  }, []);

  function toggleTable(v) { setShowTableState(v); setShowTable(v); }
  function toggleLabel(v) { setShowLabelState(v); setShowLabel(v); }

  async function onTest() {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Informe o endereço do servidor.' });
      return;
    }
    setTesting(true);
    setStatus(null);
    const ok = await pingServer(normalized);
    setStatus(ok ? 'ok' : 'fail');
    setTesting(false);
  }

  async function onSave() {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) {
      setFeedback({ variant: 'danger', title: 'Atenção', message: 'Informe o endereço do servidor.' });
      return;
    }
    await setApiBaseUrl(normalized);
    reconnectSocket();
    setFeedback({
      variant: 'success',
      title: 'Conexão salva',
      message: `O app vai usar:\n${normalized}`,
      onClose: () => navigation.goBack(),
    });
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" avoidKeyboard={false}>
      <DarkHeader
        title="Configurar conexão"
        subtitle="Endereço do servidor da API"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          <Text style={styles.label}>Endereço do servidor</Text>
          <Input
            value={url}
            onChangeText={(t) => { setUrl(t); setStatus(null); }}
            placeholder="http://192.168.0.10:3000"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            fieldStyle={styles.inputField}
            inputStyle={styles.inputText}
            style={styles.inputWrap}
          />

          <Text style={styles.hint}>
            <Feather name="info" size={20} color={colors.textMuted} />  Use o IP do computador/servidor onde a API
            está rodando, na mesma rede dos tablets. Ex.: http://192.168.0.10:3000
          </Text>

          {status === 'ok' ? (
            <View style={[styles.statusBox, { backgroundColor: '#E7F6EC' }]}>
              <Feather name="check-circle" size={28} color="#1E9E54" />
              <Text style={[styles.statusText, { color: '#1E7E45' }]}>Servidor encontrado. Conexão OK.</Text>
            </View>
          ) : status === 'fail' ? (
            <View style={[styles.statusBox, { backgroundColor: '#FBEAEA' }]}>
              <Feather name="x-circle" size={28} color={colors.danger} />
              <Text style={[styles.statusText, { color: colors.danger }]}>
                Não foi possível conectar. Verifique o IP, a porta e se a API está no ar.
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Button
              title="Testar conexão"
              variant="outline"
              onPress={onTest}
              loading={testing}
              icon={<Feather name="wifi" size={26} color={colors.primary} />}
              size="lg"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          </View>
          <View style={styles.saveButtonWrap}>
            <Button
              title="Salvar"
              onPress={onSave}
              size="lg"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          </View>

          {/* ── Campos opcionais da comanda ── */}
          <Text style={styles.sectionLabel}>Campos da comanda</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Mesa</Text>
              <Text style={styles.toggleDesc}>Exibe o seletor de mesa na comanda.</Text>
            </View>
            <Switch
              value={showTable}
              onValueChange={toggleTable}
              trackColor={{ true: colors.primary, false: '#CCC' }}
              thumbColor="#FFF"
              style={styles.switch}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Identificação</Text>
              <Text style={styles.toggleDesc}>Exibe o campo de identificação/descrição da comanda.</Text>
            </View>
            <Switch
              value={showLabel}
              onValueChange={toggleLabel}
              trackColor={{ true: colors.primary, false: '#CCC' }}
              thumbColor="#FFF"
              style={styles.switch}
            />
          </View>

        </View>
      </ScrollView>

      <FeedbackModal
        visible={!!feedback}
        variant={feedback?.variant}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        okLabel="OK"
        onClose={() => { const cb = feedback?.onClose; setFeedback(null); cb?.(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 34,
    paddingTop: 34,
    paddingBottom: 48,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: '94%',
  },
  label: {
    ...typography.bodyBold,
    color: colors.textDark,
    fontSize: 25,
    marginBottom: 14,
  },
  inputWrap: {
    marginBottom: 14,
  },
  inputField: {
    height: 86,
    paddingHorizontal: 24,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  inputText: {
    fontSize: 24,
  },
  hint:  {
    color: colors.textMuted,
    fontSize: 19,
    lineHeight: 28,
    marginBottom: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
    padding: 22,
    borderRadius: radii.lg,
    marginTop: 22,
  },
  statusText: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  actionButton: {
    height: 78,
    borderRadius: radii.lg,
  },
  actionButtonText: {
    fontSize: 23,
  },
  saveButtonWrap: {
    marginTop: 18,
  },

  sectionLabel: {
    ...typography.bodyBold,
    color: colors.textDark,
    fontSize: 26,
    marginTop: 46,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    columnGap: 20,
  },
  toggleTitle: {
    ...typography.bodyBold,
    color: colors.textDark,
    fontSize: 24,
  },
  toggleDesc:  {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 25,
    marginTop: 6,
  },
  switch: {
    transform: [{ scaleX: 1.35 }, { scaleY: 1.35 }],
  },
});
