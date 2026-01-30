import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function secureSet(key: string, value: string) {
  try { await SecureStore.setItemAsync(key, value, { keychainService: 'scanner-app' }); }
  catch { await AsyncStorage.setItem(key, value); }
}

async function secureGet(key: string) {
  try { const v = await SecureStore.getItemAsync(key, { keychainService: 'scanner-app' }); return v ?? undefined; }
  catch { const v = await AsyncStorage.getItem(key); return v ?? undefined; }
}

async function secureDelete(key: string) {
  try { await SecureStore.deleteItemAsync(key, { keychainService: 'scanner-app' }); }
  catch { await AsyncStorage.removeItem(key); }
}

export const storage = { secureSet, secureGet, secureDelete };
