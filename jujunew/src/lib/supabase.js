import { createClient } from '@supabase/supabase-js'

// Connect to the new Supabase Project ID: punrfsoqebsenknrhtkd
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://punrfsoqebsenknrhtkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For this specific static site, we don't necessarily need session persistence,
    // but it's enabled by default if we ever add a real login later.
    persistSession: true,
    autoRefreshToken: true,
  }
})
