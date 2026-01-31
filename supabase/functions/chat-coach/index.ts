import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for Supabase edge functions
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
} | undefined;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEATURE_NAME = 'chat_coach';
const MODEL_NAME = 'google/gemini-2.5-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, brandId } = await req.json();
    
    if (!message || !brandId) {
      return new Response(
        JSON.stringify({ error: 'Message and brandId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // User client for auth and RLS-protected queries
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    // Admin client for usage tracking (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has Pro or Business plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (!profile || profile.plan === 'free') {
      return new Response(
        JSON.stringify({ error: 'Pro plan required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (50 messages per day for Pro, unlimited for Business)
    if (profile.plan === 'pro' || profile.plan === 'giftedPro') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count } = await supabase
        .from('coach_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', yesterday.toISOString());

      if (count && count >= 50) {
        return new Response(
          JSON.stringify({ error: 'Daily message limit reached (50/day)' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify brand ownership
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('name, topic, visibility_score')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: 'Brand not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recent analyses for context
    const { data: analyses } = await supabase
      .from('analyses')
      .select('ai_engine, query, position')
      .eq('brand_id', brandId)
      .order('occurred_at', { ascending: false })
      .limit(20);

    // Get recent insights
    const { data: insights } = await supabase
      .from('insights')
      .select('text')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Prepare context data
    const mentionedEngines = analyses 
      ? [...new Set(analyses.filter(a => a.position).map(a => a.ai_engine))]
      : [];
    
    const missingQueries = analyses 
      ? analyses.filter(a => !a.position).map(a => a.query).slice(0, 5)
      : [];

    const totalQueries = analyses ? new Set(analyses.map(a => a.query)).size : 0;
    const mentionCount = analyses ? analyses.filter(a => a.position).length : 0;
    const analysesLength = analyses ? analyses.length : 1;

    // Build system prompt with user's data
    const systemPrompt = `You are the GEORISE Optimization Coach, an AI assistant that helps users improve their AI visibility across different AI search engines.

Current User Data:
- Brand: ${brand.name}
- Topic/Industry: ${brand.topic}
- Visibility Score: ${brand.visibility_score}/100
- Mentioned on: ${mentionedEngines.length > 0 ? mentionedEngines.join(', ') : 'None yet'}
- Total queries tested: ${totalQueries}
- Mention rate: ${totalQueries > 0 ? Math.round((mentionCount / analysesLength) * 100) : 0}%
- Missing from queries like: ${missingQueries.length > 0 ? missingQueries.join(', ') : 'N/A'}
- Recent insights: ${insights && insights.length > 0 ? insights.map(i => i.text).join('. ') : 'No insights yet'}

Your role:
1. Analyze visibility gaps based on real data
2. Provide specific, actionable recommendations
3. Explain why certain AI engines don't mention them
4. Suggest content topics and strategies
5. Be encouraging but honest about improvement areas

Keep responses:
- Concise (under 250 words)
- Specific to their actual data
- Actionable with clear next steps
- Professional but friendly tone
- Use the brand name naturally

Do not:
- Make up data you don't have
- Promise specific score increases
- Recommend unethical tactics
- Be vague or generic`;

    // Get conversation history
    const { data: history } = await supabase
      .from('coach_conversations')
      .select('role, message')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => ({ role: h.role, content: h.message })),
      { role: 'user', content: message }
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        temperature: 0.7,
        max_tokens: 400
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit reached. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;
    
    // Extract token usage from API response
    const usage = aiData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);

    // Track usage in background (don't block response)
    const trackUsage = async () => {
      try {
        // Fetch tokens_per_credit setting
        const { data: settings } = await supabaseAdmin
          .from('ai_credit_settings')
          .select('value_int')
          .eq('key', 'tokens_per_credit')
          .single();
        
        const tokensPerCredit = settings?.value_int || 200;
        const creditsCharged = totalTokens / tokensPerCredit;
        
        // Generate idempotency key
        const timestamp = Date.now();
        const idempotencyKey = `${FEATURE_NAME}_${user.id}_${timestamp}`;
        
        // Insert usage event
        await supabaseAdmin.from('llm_usage_events').insert({
          user_id: user.id,
          idempotency_key: idempotencyKey,
          feature: FEATURE_NAME,
          model: MODEL_NAME,
          provider: 'lovable',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          credits_charged: creditsCharged,
          metadata: {
            brand_id: brandId,
            brand_name: brand.name,
            message_length: message.length,
            reply_length: reply.length,
          }
        });
        
        // Update user's allowance period (increment tokens_used)
        const now = new Date().toISOString();
        await supabaseAdmin
          .from('ai_allowance_periods')
          .update({
            tokens_used: supabaseAdmin.rpc('', {}), // Can't use rpc here, use raw SQL approach
          })
          .eq('user_id', user.id)
          .lte('period_start', now)
          .gte('period_end', now);
        
        // Use a direct increment approach
        const { data: currentPeriod } = await supabaseAdmin
          .from('ai_allowance_periods')
          .select('id, tokens_used')
          .eq('user_id', user.id)
          .lte('period_start', now)
          .gte('period_end', now)
          .single();
        
        if (currentPeriod) {
          await supabaseAdmin
            .from('ai_allowance_periods')
            .update({
              tokens_used: currentPeriod.tokens_used + totalTokens,
              updated_at: now,
            })
            .eq('id', currentPeriod.id);
        }
        
        console.log(`Usage tracked: ${totalTokens} tokens, ${creditsCharged.toFixed(2)} credits for user ${user.id}`);
      } catch (err) {
        console.error('Failed to track usage:', err);
        // Don't fail the request if tracking fails
      }
    };
    
    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(trackUsage());
    } else {
      // Fallback: run in background without waiting
      trackUsage();
    }

    // Save user message
    await supabase.from('coach_conversations').insert({
      user_id: user.id,
      brand_id: brandId,
      role: 'user',
      message
    });

    // Save AI response
    await supabase.from('coach_conversations').insert({
      user_id: user.id,
      brand_id: brandId,
      role: 'assistant',
      message: reply
    });

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-coach function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
