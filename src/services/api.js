import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// =================================================================
// CONFIGURAÇÃO DA API
// =================================================================
// Para forçar uma URL específica, descomente API_OVERRIDE e coloque
// o endereço aqui. Quando definido, ignora a detecção automática.
//
// Exemplos:
//   const API_OVERRIDE = 'http://localhost:3000'      // iOS sim / Web
//   const API_OVERRIDE = 'http://10.0.2.2:3000'       // emulador Android
//   const API_OVERRIDE = 'http://192.168.0.168:3000'  // celular físico
//   const API_OVERRIDE = 'https://api.exemplo.com'    // produção
// =================================================================
const API_OVERRIDE = 'http://localhost:3000';

// =================================================================
// Quando API_OVERRIDE é null, descobre o host automaticamente a partir
// do Expo (mesmo IP onde o Metro está servindo). Funciona na maioria
// dos casos sem precisar editar nada.
// =================================================================
function resolveHost() {
  if (API_OVERRIDE) return API_OVERRIDE;

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

export const API_BASE = resolveHost();

if (__DEV__) {
  console.log('[api] base =', API_BASE);
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@comandou:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Normaliza mensagem de erro para a UI
    const msg = err?.response?.data?.error
            || err?.message
            || 'Erro de comunicação com o servidor.';
    err.uiMessage = msg;
    return Promise.reject(err);
  }
);

export default api;
