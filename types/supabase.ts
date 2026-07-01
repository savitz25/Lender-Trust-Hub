/**
 * Lender Trust Hub — Supabase Database types.
 * Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <ref> > types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadCategory = 'fdic' | 'mortgage' | 'auto' | 'credit-repair' | 'mca';
export type LeadStatus = 'new' | 'contacted' | 'matched' | 'closed' | 'spam';

export interface Database {
  public: {
    Tables: {
      lenders: {
        Row: {
          id: string;
          slug: string;
          name: string;
          nmls_id: string;
          lender_type: string;
          city: string | null;
          state: string;
          state_slug: string;
          county: string;
          county_slug: string;
          zip_codes: Json;
          rating: number | null;
          review_count: number;
          trust_score: number;
          county_experience_score: number;
          loan_types: Json;
          specialties: Json;
          credit_tiers: Json;
          nmls_verified: boolean;
          cfpb_complaints: number;
          bbb_rating: string | null;
          google_rating: number | null;
          trustpilot_rating: number | null;
          short_description: string | null;
          website: string | null;
          phone: string | null;
          is_featured: boolean;
          zero_paid_placement: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['lenders']['Row']> & {
          id: string;
          slug: string;
          name: string;
          nmls_id: string;
          state: string;
          state_slug: string;
          county: string;
          county_slug: string;
        };
        Update: Partial<Database['public']['Tables']['lenders']['Row']>;
      };
      counties: {
        Row: {
          id: string;
          state: string;
          state_slug: string;
          county: string;
          county_slug: string;
          lender_count: number;
          region: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          state: string;
          state_slug: string;
          county: string;
          county_slug: string;
          lender_count?: number;
          region?: string | null;
        };
        Update: Partial<Database['public']['Tables']['counties']['Row']>;
      };
      reviews: {
        Row: {
          id: string;
          lender_id: string;
          author: string;
          rating: number;
          review_date: string;
          source: string;
          title: string | null;
          content: string;
          verified: boolean;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lender_id: string;
          author: string;
          rating: number;
          review_date: string;
          source: string;
          content: string;
          title?: string | null;
          verified?: boolean;
          location?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
      };
      testimonials: {
        Row: {
          id: string;
          lender_id: string | null;
          author: string;
          quote: string;
          context: string | null;
          featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lender_id?: string | null;
          author: string;
          quote: string;
          context?: string | null;
          featured?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Row']>;
      };
      lead_submissions: {
        Row: {
          id: string;
          email: string;
          category: LeadCategory;
          state_name: string | null;
          intent: string;
          source: string | null;
          variant: string | null;
          calculator_payload: Json | null;
          status: LeadStatus;
          created_at: string;
        };
        Insert: {
          email: string;
          category?: LeadCategory;
          state_name?: string | null;
          intent: string;
          source?: string | null;
          variant?: string | null;
          calculator_payload?: Json | null;
          status?: LeadStatus;
        };
        Update: Partial<Database['public']['Tables']['lead_submissions']['Row']>;
      };
      saved_calculator_scenarios: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          calc_id: string;
          label: string | null;
          payload: Json;
          share_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          session_id?: string | null;
          user_id?: string | null;
          calc_id: string;
          label?: string | null;
          payload?: Json;
          share_token?: string | null;
        };
        Update: Partial<Database['public']['Tables']['saved_calculator_scenarios']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}