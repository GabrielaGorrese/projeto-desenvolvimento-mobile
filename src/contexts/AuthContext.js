import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest } from '../services/authService';
import { loadApiBaseUrl } from '../services/apiConfig';

const STORAGE_TOKEN    = '@comandou:token';
const STORAGE_USER     = '@comandou:user';
const STORAGE_REMEMBER = '@comandou:remember';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [token,       setToken]       = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  // Perfil pré-selecionado na tela "Quem está tentando acessar?"
  const [selectedRole, setSelectedRole] = useState(null);
  const [rememberedUsername, setRememberedUsername] = useState('');

  useEffect(() => {
    let finished = false;
    // Fail-safe: se algum motivo o AsyncStorage não responder em 2s, libera a UI.
    const safety = setTimeout(() => {
      if (!finished) {
        console.warn('[AuthContext] bootstrap timeout — destravando UI');
        setBootstrapping(false);
      }
    }, 2000);

    (async () => {
      try {
        // Carrega a URL da API primeiro — precisa estar pronta antes de qualquer requisição.
        await loadApiBaseUrl();
        const [t, u, r] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOKEN),
          AsyncStorage.getItem(STORAGE_USER),
          AsyncStorage.getItem(STORAGE_REMEMBER),
        ]);
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
        }
        if (r) setRememberedUsername(r);
      } catch (e) {
        console.warn('[AuthContext] bootstrap error', e);
      } finally {
        finished = true;
        clearTimeout(safety);
        setBootstrapping(false);
      }
    })();

    return () => clearTimeout(safety);
  }, []);

  const signIn = useCallback(async ({ username, password, remember }) => {
    const data = await loginRequest(username, password);
    const u = { username: data.username, role: data.role };
    await AsyncStorage.multiSet([
      [STORAGE_TOKEN, data.token],
      [STORAGE_USER,  JSON.stringify(u)],
    ]);
    if (remember) {
      await AsyncStorage.setItem(STORAGE_REMEMBER, username);
    } else {
      await AsyncStorage.removeItem(STORAGE_REMEMBER);
    }
    setToken(data.token);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_TOKEN, STORAGE_USER]);
    setToken(null);
    setUser(null);
    setSelectedRole(null);
  }, []);

  const value = {
    user,
    token,
    bootstrapping,
    selectedRole,
    setSelectedRole,
    rememberedUsername,
    signIn,
    signOut,
    isManager:   user?.role === 'manager',
    isAttendant: user?.role === 'attendant',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
