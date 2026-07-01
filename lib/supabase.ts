/**
 * Barrel export — prefer direct imports from lib/supabase/* for tree-shaking.
 * @deprecated Use @/lib/supabase/client or @/lib/supabase/server explicitly.
 */
export {
  isSupabaseConfigured,
  isSupabaseAdminConfigured,
  getSupabaseUrl,
  getSupabaseAnonKey,
} from '@/lib/supabase/config';

export { createBrowserSupabaseClient } from '@/lib/supabase/client';