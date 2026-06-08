import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = '@comandou:apiBaseUrl';

// ===========================================================================
// ENDEREÇO PADRÃO DE FÁBRICA — o APK já vem configurado com este endereço.
// Troque pelo IP/porta do servidor da API na rede onde os tablets vão rodar.
// Deixe '' (vazio) para não cravar nada e cair na detecção automática (dev).
// Ex.: 'http://192.168.0.10:3000'
// ===========================================================================
const BUILT_IN_DEFAULT = '';

// URL atual em memória (lida no bootstrap). Os serviços leem daqui a cada uso.
let currentBaseUrl = null;

// URL padrão quando nada foi configurado ainda:
//  - Se BUILT_IN_DEFAULT estiver preenchido, usa ele (APK pré-configurado).
//  - Em dev (Expo Go), descobre o host do Metro automaticamente.
//  - Senão cai para localhost.
function defaultBaseUrl() {
  if (BUILT_IN_DEFAULT) return BUILT_IN_DEFAULT;

  const debuggerHost =
       Constants?.expoConfig?.hostUri
    || Constants?.expoGoConfig?.debuggerHost
    || Constants?.manifest?.debuggerHost
    || Constants?.manifest2?.extra?.expoClient?.hostUri;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

// Normaliza o que o usuário digita: adiciona http:// se faltar e remove a barra final.
export function normalizeBaseUrl(raw) {
  let url = (raw || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url.replace(/\/+$/, '');
}

// Lê a URL salva (chamado uma vez no bootstrap). Define currentBaseUrl.
export async function loadApiBaseUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    currentBaseUrl = saved && saved.trim() ? saved.trim() : defaultBaseUrl();
  } catch {
    currentBaseUrl = defaultBaseUrl();
  }
  return currentBaseUrl;
}

// URL em uso agora. Se ainda não carregou, usa o padrão (evita undefined).
export function getApiBaseUrl() {
  return currentBaseUrl || defaultBaseUrl();
}

// Persiste uma nova URL e atualiza a memória. Retorna a URL normalizada.
export async function setApiBaseUrl(raw) {
  const url = normalizeBaseUrl(raw);
  currentBaseUrl = url;
  await AsyncStorage.setItem(STORAGE_KEY, url);
  return url;
}

// True quando o usuário já configurou uma URL manualmente.
export async function hasSavedApiBaseUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return !!(saved && saved.trim());
  } catch {
    return false;
  }
}
