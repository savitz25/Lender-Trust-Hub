import 'server-only';

import { createClientIfConfigured } from '@/lib/supabase/server';
import { isSupabaseAdminConfigured, isSupabaseConfigured } from '@/lib/supabase/config';

export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  adminConfigured: boolean;
  connected: boolean;
  lenderCount?: number;
  error?: string;
}> {
  const configured = isSupabaseConfigured();
  const adminConfigured = isSupabaseAdminConfigured();

  if (!configured) {
    return { configured: false, adminConfigured, connected: false, error: 'Public env vars missing' };
  }

  try {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return { configured, adminConfigured, connected: false, error: 'Client creation failed' };
    }

    const { count, error } = await supabase
      .from('lenders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { configured, adminConfigured, connected: false, error: error.message };
    }

    return { configured, adminConfigured, connected: true, lenderCount: count ?? 0 };
  } catch (err) {
    return {
      configured,
      adminConfigured,
      connected: false,
      error: err instanceof Error ? err.message : 'Health check failed',
    };
  }
}