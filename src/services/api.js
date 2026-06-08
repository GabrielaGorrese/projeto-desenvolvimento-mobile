import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './apiConfig';

// A URL base é resolvida em runtime a cada requisição (getApiBaseUrl), pois o
// usuário pode trocá-la pela tela de configuração sem reiniciar o app.
const api = axios.create({ timeout: 15000 });

api.interceptors.request.use(async (config) => {
  config.baseURL = `${getApiBaseUrl()}/api`;

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
