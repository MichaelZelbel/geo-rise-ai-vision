import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AllowancePeriod {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
  period_start: string;
  period_end: string;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CreditSettings {
  tokens_per_credit: number;
  credits_free_per_month: number;
  credits_pro_per_month: number;
  credits_business_per_month: number;
  [key: string]: number;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    let body: { user_id?: string; batch_init?: boolean } = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine
    }

    const { user_id: targetUserId, batch_init } = body;

    // Get caller info from JWT if present
    let callerId: string | null = null;
    let isServiceRole = false;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        callerId = user.id;
      }
      
      // Check if this is a service role call
      if (authHeader.includes(serviceRoleKey)) {
        isServiceRole = true;
      }
    }

    // Handle batch initialization
    if (batch_init) {
      // Require admin or service role for batch init
      if (!isServiceRole) {
        if (!callerId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required for batch_init' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
          _user_id: callerId, 
          _role: 'admin' 
        });
        
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Admin privileges required for batch_init' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const result = await initializeAllUsers(supabaseAdmin);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single user mode
    const userId = targetUserId || callerId;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id required or must be authenticated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If targeting a different user, require admin
    if (targetUserId && callerId && targetUserId !== callerId && !isServiceRole) {
      const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
        _user_id: callerId, 
        _role: 'admin' 
      });
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin privileges required to manage other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const period = await ensureUserAllowance(supabaseAdmin, userId);
    
    return new Response(
      JSON.stringify({ period }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ensure-token-allowance:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getCreditSettings(supabase: AnySupabaseClient): Promise<CreditSettings> {
  const { data, error } = await supabase
    .from('ai_credit_settings')
    .select('key, value_int');
  
  if (error) throw new Error(`Failed to fetch credit settings: ${error.message}`);
  
  const settings: CreditSettings = {
    tokens_per_credit: 200,
    credits_free_per_month: 0,
    credits_pro_per_month: 1500,
    credits_business_per_month: 5000,
  };
  
  for (const row of data || []) {
    if (row.key in settings) {
      settings[row.key] = row.value_int;
    }
  }
  
  return settings;
}

function getCreditsForPlan(plan: string, settings: CreditSettings): number {
  switch (plan) {
    case 'free':
      return settings.credits_free_per_month;
    case 'pro':
    case 'giftedPro':
      return settings.credits_pro_per_month;
    case 'business':
    case 'giftedAgency':
      return settings.credits_business_per_month;
    default:
      return settings.credits_free_per_month;
  }
}

function getPeriodBounds(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
}

async function ensureUserAllowance(
  supabase: AnySupabaseClient,
  userId: string
): Promise<AllowancePeriod> {
  const { periodStart, periodEnd } = getPeriodBounds();
  
  // Check for existing current period
  const { data: existingPeriod, error: fetchError } = await supabase
    .from('ai_allowance_periods')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .lte('period_start', new Date().toISOString())
    .single();
  
  if (existingPeriod && !fetchError) {
    console.log(`Found existing period for user ${userId}`);
    return existingPeriod as AllowancePeriod;
  }
  
  // Need to create a new period
  console.log(`Creating new period for user ${userId}`);
  
  // Get user's plan
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile) {
    throw new Error(`Failed to fetch user profile: ${profileError?.message || 'User not found'}`);
  }
  
  const settings = await getCreditSettings(supabase);
  const creditsForPlan = getCreditsForPlan(profile.plan, settings);
  const baseTokens = creditsForPlan * settings.tokens_per_credit;
  
  // Check for previous period and calculate rollover
  let rolloverTokens = 0;
  
  const { data: previousPeriod } = await supabase
    .from('ai_allowance_periods')
    .select('*')
    .eq('user_id', userId)
    .lt('period_end', periodStart.toISOString())
    .order('period_end', { ascending: false })
    .limit(1)
    .single();
  
  if (previousPeriod) {
    const remainingTokens = previousPeriod.tokens_granted - previousPeriod.tokens_used;
    // Rollover is capped at the plan's monthly allowance (base_tokens)
    rolloverTokens = Math.max(0, Math.min(remainingTokens, baseTokens));
    console.log(`Rollover from previous period: ${rolloverTokens} tokens`);
  }
  
  const totalTokensGranted = baseTokens + rolloverTokens;
  
  // Determine source based on plan
  let source = 'free_tier';
  if (['pro', 'giftedPro'].includes(profile.plan)) {
    source = 'subscription';
  } else if (['business', 'giftedAgency'].includes(profile.plan)) {
    source = 'subscription';
  }
  
  // Insert new period
  const { data: newPeriod, error: insertError } = await supabase
    .from('ai_allowance_periods')
    .insert({
      user_id: userId,
      tokens_granted: totalTokensGranted,
      tokens_used: 0,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      source,
      metadata: {
        base_tokens: baseTokens,
        rollover_tokens: rolloverTokens,
        plan: profile.plan,
        credits_granted: creditsForPlan + (rolloverTokens / settings.tokens_per_credit),
      },
    })
    .select()
    .single();
  
  if (insertError || !newPeriod) {
    throw new Error(`Failed to create allowance period: ${insertError?.message}`);
  }
  
  console.log(`Created period for user ${userId}: ${totalTokensGranted} tokens granted`);
  return newPeriod as AllowancePeriod;
}

async function initializeAllUsers(
  supabase: AnySupabaseClient
): Promise<{ initialized: number; skipped: number; errors: string[] }> {
  const { periodStart: _periodStart, periodEnd: _periodEnd } = getPeriodBounds();
  
  // Get all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, plan');
  
  if (profilesError || !profiles) {
    throw new Error(`Failed to fetch profiles: ${profilesError?.message}`);
  }
  
  // Get users who already have a current period
  const { data: existingPeriods } = await supabase
    .from('ai_allowance_periods')
    .select('user_id')
    .gte('period_end', new Date().toISOString())
    .lte('period_start', new Date().toISOString());
  
  const usersWithPeriods = new Set((existingPeriods || []).map((p: { user_id: string }) => p.user_id));
  
  let initialized = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const profile of profiles) {
    if (usersWithPeriods.has(profile.id)) {
      skipped++;
      continue;
    }
    
    try {
      await ensureUserAllowance(supabase, profile.id);
      initialized++;
    } catch (error) {
      const msg = `Failed to initialize user ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      errors.push(msg);
    }
  }
  
  console.log(`Batch init complete: ${initialized} initialized, ${skipped} skipped, ${errors.length} errors`);
  
  return { initialized, skipped, errors };
}