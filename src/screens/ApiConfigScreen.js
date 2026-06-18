import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
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
import { getUiScale } from '../utils/uiScale';

async function pingServer(baseUrl, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/api-docs`, { method: 'GET', signal: ctrl.signal });
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function ApiConfigScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const scale = getUiScale(width, height);

  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);

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

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 24 * scale, paddingTop: 24 * scale }]}>
        <View style={styles.content}>

          <Text style={[styles.label, { fontSize: 18 * scale }]}>Endereço do servidor</Text>
          <Input
            value={url}
            onChangeText={(t) => { setUrl(t); setStatus(null); }}
            placeholder="http://192.168.0.10:3000"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            fieldStyle={[styles.inputField, { height: 56 * scale, paddingHorizontal: 16 * scale }]}
            inputStyle={[styles.inputText, { fontSize: 16 * scale }]}
            style={styles.inputWrap}
          />

          <Text style={[styles.hint, { fontSize: 14 * scale, lineHeight: 20 * scale }]}>
            <Feather name="info" size={16 * scale} color={colors.textMuted} /> Use o IP do servidor na mesma rede.
          </Text>

          {status === 'ok' ? (
            <View style={[styles.statusBox, { padding: 14 * scale }]}>
              <Feather name="check-circle" size={20 * scale} color="#1E9E54" />
              <Text style={[styles.statusText, { fontSize: 14 * scale }]}>Servidor encontrado.</Text>
            </View>
          ) : status === 'fail' ? (
            <View style={[styles.statusBox, { padding: 14 * scale }]}>
              <Feather name="x-circle" size={20 * scale} color={colors.danger} />
              <Text style={[styles.statusText, { fontSize: 14 * scale }]}>
                Falha na conexão.
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 16 * scale }}>
            <Button
              title="Testar conexão"
              variant="outline"
              onPress={onTest}
              loading={testing}
              icon={<Feather name="wifi" size={18 * scale} color={colors.primary} />}
              size="lg"
              style={[styles.actionButton, { height: 52 * scale }]}
              textStyle={{ fontSize: 16 * scale }}
            />
          </View>

          <View style={{ marginTop: 10 * scale }}>
            <Button
              title="Salvar"
              onPress={onSave}
              size="lg"
              style={[styles.actionButton, { height: 52 * scale }]}
              textStyle={{ fontSize: 16 * scale }}
            />
          </View>

          <Text style={[styles.sectionLabel, { fontSize: 18 * scale, marginTop: 28 * scale }]}>
            Campos da comanda
          </Text>

          <View style={[styles.toggleRow, { paddingVertical: 14 * scale }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { fontSize: 16 * scale }]}>Mesa</Text>
              <Text style={[styles.toggleDesc, { fontSize: 13 * scale }]}>Exibe o seletor.</Text>
            </View>
            <Switch
              value={showTable}
              onValueChange={toggleTable}
              trackColor={{ true: colors.primary, false: '#CCC' }}
              thumbColor="#FFF"
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
            />
          </View>

          <View style={[styles.toggleRow, { paddingVertical: 14 * scale }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { fontSize: 16 * scale }]}>Identificação</Text>
              <Text style={[styles.toggleDesc, { fontSize: 13 * scale }]}>Campo opcional.</Text>
            </View>
            <Switch
              value={showLabel}
              onValueChange={toggleLabel}
              trackColor={{ true: colors.primary, false: '#CCC' }}
              thumbColor="#FFF"
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
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
    paddingBottom: 32,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: '94%',
  },
  label: {
    ...typography.bodyBold,
    color: colors.textDark,
    marginBottom: 8,
  },
  inputWrap: {
    marginBottom: 10,
  },
  inputField: {
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  inputText: {},
  hint: {
    color: colors.textMuted,
    marginBottom: 6,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    borderRadius: radii.lg,
    marginTop: 12,
  },
  statusText: {
    flex: 1,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: radii.lg,
  },
  sectionLabel: {
    ...typography.bodyBold,
    color: colors.textDark,
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    columnGap: 12,
  },
  toggleTitle: {
    ...typography.bodyBold,
    color: colors.textDark,
  },
  toggleDesc: {
    color: colors.textMuted,
    marginTop: 4,
  },
});