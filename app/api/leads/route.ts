import { NextResponse } from 'next/server';
import { submitLead } from '@/lib/supabase/queries/leads';
import type { LeadCategory } from '@/types/supabase';

const VALID_CATEGORIES: LeadCategory[] = ['fdic', 'mortgage', 'auto', 'credit-repair', 'mca'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const intent = typeof body.intent === 'string' ? body.intent.trim() : '';
    const category = (body.category ?? 'mortgage') as LeadCategory;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Valid email required' }, { status: 400 });
    }
    if (!intent) {
      return NextResponse.json({ ok: false, error: 'Intent required' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ ok: false, error: 'Invalid category' }, { status: 400 });
    }

    const result = await submitLead({
      email,
      category,
      intent,
      stateName: body.stateName,
      source: body.source ?? 'lead_capture_form',
      variant: body.variant,
      calculatorPayload: body.calculatorPayload,
    });

    if (!result.ok) {
      // Graceful fallback: accept lead client-side success if DB unavailable
      const status = result.error?.includes('not configured') ? 202 : 500;
      return NextResponse.json(
        { ok: status === 202, warning: result.error, persisted: false },
        { status },
      );
    }

    return NextResponse.json({ ok: true, id: result.id, persisted: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}