import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nzlxmximgqqbhkpdkptg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bHhteGltZ3FxYmhrcGRrcHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDEyNTcsImV4cCI6MjA4NzU3NzI1N30.lEkgtefR8LsY_nfxGeTNsz65-H23jqa8BHsdEw6KkaI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
