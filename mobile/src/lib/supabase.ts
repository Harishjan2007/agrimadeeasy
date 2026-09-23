import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AgriME Shared Supabase configuration matching web application
const SUPABASE_URL = 'https://fugkokexgjvkgdrxzvny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_riHnGS4PMsSHWNAHGZFbQg_uZrKYTp3';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
