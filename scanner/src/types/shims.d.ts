declare module '@react-native-community/netinfo' {
  export type NetInfoState = { isConnected?: boolean | null; isInternetReachable?: boolean | null };
  const NetInfo: { addEventListener: (cb: (state: NetInfoState) => void) => void };
  export default NetInfo;
}

declare module 'expo-camera' {
  import * as React from 'react';
  export const CameraView: React.ComponentType<any>;
  export const Camera: { requestCameraPermissionsAsync: () => Promise<{ status: 'granted' | 'denied' | 'undetermined' }> };
}

declare module 'expo-secure-store' {
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'expo-sqlite' {
  export type SQLiteDatabase = any;
  export function openDatabaseSync(name: string): SQLiteDatabase;
}

declare module 'crypto-js' {
  const CryptoJS: any;
  export default CryptoJS;
}
