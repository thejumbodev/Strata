import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Strata] ⚠️  Supabase env vars are missing.\n' +
    '  Make sure C:\\Users\\Ben\\Strata\\.env contains:\n' +
    '  VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJ...'
  )
} else {
  console.log('[Strata] Supabase client initialised →', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
