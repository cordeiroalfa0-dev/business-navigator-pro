import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwiugelvyptugwkgxdov.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aXVnZWx2eXB0dWd3a2d4ZG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQ5NjUsImV4cCI6MjA4NTU1MDk2NX0.BTND5qI31keMQ5WRElMhuxr7ASOvLf_TX_Icm2k2ZNs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
