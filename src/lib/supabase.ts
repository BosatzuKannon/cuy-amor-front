import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as ExpoCrypto from 'expo-crypto';
import 'react-native-url-polyfill/auto';

const hasSubtle = globalThis.crypto && typeof globalThis.crypto.subtle !== 'undefined';

if (!hasSubtle) {
  globalThis.crypto = {
    getRandomValues: ExpoCrypto.getRandomValues,
    randomUUID: ExpoCrypto.randomUUID,
    subtle: {
      digest(algorithm: AlgorithmIdentifier | string, data: BufferSource) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        return ExpoCrypto.digest(name as ExpoCrypto.CryptoDigestAlgorithm, data);
      },
    },
  } as unknown as typeof globalThis.crypto;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});