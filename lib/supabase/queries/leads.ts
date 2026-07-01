import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import type { LeadCategory } from '@/types/supabase';

export interface SubmitLeadInput {
  email: string;
  category: LeadCategory;
  stateName?: string;
  intent: string;
  source?: string;
  variant?: string;
  calculatorPayload?: Record<string, unknown>;
}

export async function submitLead(input: SubmitLeadInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: 'Supabase admin not configured' };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lead_submissions')
      .insert({
        email: input.email.trim().toLowerCase(),
        category: input.category,
        state_name: input.stateName ?? null,
        intent: input.intent,
        source: input.source ?? 'website',
        variant: input.variant ?? null,
        calculator_payload: input.calculatorPayload ?? null,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[LTH] submitLead error:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}