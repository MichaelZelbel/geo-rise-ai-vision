import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { runId } = await req.json();

        if (!runId) {
            return new Response(
                JSON.stringify({ error: 'runId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Use service role to bypass RLS if needed, or ANON if user context is passed
        // Using service role key here to ensure we can read/write analysis data regardless of context, 
        // assuming this function is called securely (e.g. from n8n or authenticated client).
        // If called from client, we should probably use ANON key and pass auth header.
        // Given the context, let's use the Auth header if present, otherwise fall back to Service Role if needed?
        // Actually, 'chat-coach' used ANON key with Auth header. Let's try to respect that pattern for security.

        const authHeader = req.headers.get('Authorization');
        const clientOptions = authHeader ? {
            global: { headers: { Authorization: authHeader } },
        } : {};

        const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);

        // Fetch analysis run details
        const { data: run, error: runError } = await supabase
            .from('analysis_runs')
            .select('brand_id, brand_name, topic, user_id')
            .eq('id', runId)
            .single();

        if (runError || !run) {
            return new Response(
                JSON.stringify({ error: 'Analysis run not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Fetch analyses (search results)
        const { data: analyses, error: analysesError } = await supabase
            .from('analyses')
            .select('ai_engine, query, full_response, context, position, mentioned')
            .eq('run_id', runId);

        if (analysesError) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch analyses' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!analyses || analyses.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No analyses found for this run' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Prepare data for LLM
        // We need to summarize the data to fit in context window if it's large.
        // Extracting relevant parts: engine, query, and the text that might contain competitors.
        const analysisSummary = analyses.map(a => ({
            engine: a.ai_engine,
            query: a.query,
            content: (a.full_response || a.context || "").substring(0, 1000) // Truncate to save tokens
        }));

        const systemPrompt = `You are a Competitor Intelligence Analyst. 
Your task is to analyze search results for the brand "${run.brand_name}" (Topic: ${run.topic}) and identify its top competitors.

Input Data: A list of search results from various AI engines.

Output Requirements:
1. Identify the top 3-5 competitors mentioned in the search results.
2. For each competitor, estimate a "Visibility Score" (0-100) based on how frequently and positively they appear compared to others.
3. Write a "Gap Analysis" (1 short sentence) explaining why this competitor is performing well or what they are doing that "${run.brand_name}" is not (e.g., "Frequently mentioned for pricing," "Cited in top 10 lists," "Stronger technical documentation").
4. Return ONLY a valid JSON array.

Format:
[
  {
    "name": "Competitor Name",
    "score": 85,
    "gap": "Consistently recommended for enterprise features."
  },
  ...
]`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(analysisSummary) }
        ];

        // Call AI (Lovable Gateway)
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
            throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages,
                temperature: 0.5,
                response_format: { type: "json_object" } // Force JSON if supported, otherwise prompt handles it
            }),
        });

        if (!aiResponse.ok) {
            const text = await aiResponse.text();
            throw new Error(`AI API error: ${aiResponse.status} - ${text}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;

        let competitorData;
        try {
            // Clean up potential markdown code blocks
            const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
            competitorData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse AI response:", content);
            throw new Error("Failed to parse competitor data from AI");
        }

        // Update analysis_run with competitor data
        const { error: updateError } = await supabase
            .from('analysis_runs')
            .update({ competitor_data: competitorData })
            .eq('id', runId);

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({ success: true, data: competitorData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in analyze-competitors:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
