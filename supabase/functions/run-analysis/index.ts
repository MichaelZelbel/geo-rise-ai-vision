import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function generateQueries(topic: string, brandName: string): string[] {
  return [
    `Who are the leading experts in ${topic}?`,
    `What are the best ${topic} companies?`,
    `Top ${topic} consultants and advisors`,
    `${topic} thought leaders to follow`,
    `Best ${topic} resources and tools`,
    `${topic} case studies and success stories`,
    `How to find a good ${topic} consultant`,
    `${topic} industry analysis and trends`,
    `Who should I hire for ${topic} services?`,
    `${topic} vendor comparison and reviews`,
    `${brandName} reviews and reputation`,
    `Is ${brandName} good at ${topic}?`,
    `${brandName} vs competitors in ${topic}`,
    `${topic} expert recommendations`,
    `${topic} consulting firms ranking`,
    `${topic} professional services providers`,
    `Where to learn about ${topic}`,
    `${topic} conference speakers and experts`,
    `${topic} authors and publications`,
    `${topic} innovation leaders`
  ];
}

async function checkPerplexity(
  query: string,
  brandName: string
): Promise<{
  mentioned: boolean;
  position: number | null;
  context: string | null;
  citations: string[];
}> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  console.log(`Querying Perplexity: "${query}"`);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides comprehensive answers with citations.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      return_citations: true,
      return_related_questions: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Perplexity API error: ${response.status} - ${errorText}`);
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data: PerplexityResponse = await response.json();
  const content = data.choices[0].message.content;
  const citations = data.citations || [];

  // Check if brand is mentioned in the response
  const mentioned = content.toLowerCase().includes(brandName.toLowerCase());

  if (!mentioned) {
    return {
      mentioned: false,
      position: null,
      context: null,
      citations: []
    };
  }

  // Find position of first mention
  const lowerContent = content.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const firstIndex = lowerContent.indexOf(lowerBrand);
  
  // Estimate position based on where in response (beginning = position 1, etc.)
  const position = firstIndex < 100 ? 1 : 
                   firstIndex < 300 ? 2 : 
                   firstIndex < 600 ? 3 : 4;

  // Extract context around the mention (50 chars before and after)
  const contextStart = Math.max(0, firstIndex - 50);
  const contextEnd = Math.min(content.length, firstIndex + brandName.length + 50);
  const context = content.substring(contextStart, contextEnd);

  console.log(`✓ Brand mentioned at position ${position}`);

  return {
    mentioned,
    position,
    context,
    citations
  };
}

function calculateRealScore(results: Array<{ mentioned: boolean; position: number | null }>): number {
  const totalQueries = results.length;
  const mentions = results.filter(r => r.mentioned).length;
  
  // Base score from mention percentage
  const mentionRate = mentions / totalQueries;
  let score = mentionRate * 70; // 70 points possible from mention rate
  
  // Bonus points for position quality
  let positionBonus = 0;
  for (const result of results) {
    if (result.mentioned && result.position) {
      if (result.position === 1) positionBonus += 1.5;
      else if (result.position === 2) positionBonus += 1.0;
      else if (result.position === 3) positionBonus += 0.5;
    }
  }
  
  score += Math.min(30, positionBonus); // Max 30 bonus points
  
  return Math.round(Math.min(100, score));
}

function generateRealInsights(
  results: Array<{ mentioned: boolean; position: number | null; query: string; citations: string[] }>,
  topic: string,
  brandName: string,
  score: number
): string[] {
  const insights = [];
  const mentions = results.filter(r => r.mentioned).length;
  const totalQueries = results.length;
  const mentionRate = (mentions / totalQueries) * 100;

  // Insight 1: Mention rate
  insights.push(
    `Your brand appears in ${mentions} out of ${totalQueries} relevant queries (${Math.round(mentionRate)}% mention rate).`
  );

  // Insight 2: Position analysis
  const topPositions = results.filter(r => r.mentioned && r.position && r.position <= 2).length;
  if (topPositions > 0) {
    insights.push(
      `Strong performance: You appear in top 2 results for ${topPositions} queries.`
    );
  } else if (mentions > 0) {
    insights.push(
      `Focus on getting ranked higher. Currently not appearing in top positions for most queries.`
    );
  }

  // Insight 3: Coverage gaps
  const notMentioned = results.filter(r => !r.mentioned);
  if (notMentioned.length > 0) {
    const gapQuery = notMentioned[0].query;
    insights.push(
      `Opportunity: Create content specifically about "${gapQuery}" to improve visibility.`
    );
  }

  // Insight 4: Score-based recommendation
  if (score < 40) {
    insights.push(
      `Your visibility score is below industry average. Publish 2-3 authoritative articles about ${topic} with clear examples and case studies.`
    );
  } else if (score < 70) {
    insights.push(
      `Good foundation! Increase visibility by contributing to industry publications and podcasts about ${topic}.`
    );
  } else {
    insights.push(
      `Excellent visibility! Maintain momentum by regularly sharing insights and engaging with the ${topic} community.`
    );
  }

  // Insight 5: Citations
  const withCitations = results.filter(r => r.mentioned && r.citations && r.citations.length > 0).length;
  if (mentions > 0) {
    const citationRate = (withCitations / mentions) * 100;
    insights.push(
      `${Math.round(citationRate)}% of your mentions include source citations. ${citationRate < 50 ? 'Improve this by building a stronger online presence with verifiable credentials.' : 'Great work on authoritative content!'}`
    );
  }

  return insights;
}

async function checkRateLimit(userId: string, supabase: any): Promise<boolean> {
  // Check user's plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  // Get last analysis for this user
  const { data: brands } = await supabase
    .from('brands')
    .select('last_run')
    .eq('user_id', userId);

  if (!brands || brands.length === 0) return true; // First analysis

  const lastRun = brands[0]?.last_run;
  if (!lastRun) return true;

  const now = new Date();
  const lastRunDate = new Date(lastRun);
  const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

  // Rate limits by plan
  if (profile.plan === 'free') {
    return hoursSinceLastRun >= 168; // 7 days
  } else if (profile.plan === 'pro' || profile.plan === 'giftedPro') {
    return hoursSinceLastRun >= 24; // 1 day
  } else if (profile.plan === 'business' || profile.plan === 'giftedAgency') {
    return hoursSinceLastRun >= 24; // 1 day
  }

  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brandId, brandName, topic, userId } = await req.json();

    console.log(`Starting analysis for brand: ${brandName} (${topic})`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify ownership
    const { data: brand, error: brandFetchError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', userId)
      .single();

    if (brandFetchError || !brand) {
      console.error('Brand not found or unauthorized:', brandFetchError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const canRun = await checkRateLimit(userId, supabase);
    if (!canRun) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Upgrade your plan for more frequent analyses.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate queries
    const queries = generateQueries(topic, brandName);
    const results: Array<{ mentioned: boolean; position: number | null; query: string; citations: string[] }> = [];
    const runId = crypto.randomUUID();

    console.log(`Running ${queries.length} queries...`);

    // Process queries with limited concurrency to avoid timeouts
    const CONCURRENCY = 4;
    for (let i = 0; i < queries.length; i += CONCURRENCY) {
      const batch = queries.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (query) => {
          try {
            const result = await checkPerplexity(query, brandName);
            
            // Store result
            await supabase.from('analyses').insert({
              brand_id: brandId,
              run_id: runId,
              ai_engine: 'perplexity',
              query,
              position: result.position,
              mention_type: result.mentioned ? (result.citations.length > 0 ? 'citation' : 'name_only') : null,
              sentiment: result.mentioned ? 'neutral' : null,
              url: result.citations[0] || null,
              occurred_at: new Date().toISOString()
            });

            results.push({
              mentioned: result.mentioned,
              position: result.position,
              query,
              citations: result.citations
            });
          } catch (error) {
            console.error(`Error checking query "${query}":`, error);
            // Store failed query result as not mentioned
            results.push({
              mentioned: false,
              position: null,
              query,
              citations: []
            });
          }
        })
      );
      // Brief pause between batches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Calculate score
    const score = calculateRealScore(results);
    console.log(`Calculated visibility score: ${score}`);

    // Generate insights
    const insightTexts = generateRealInsights(results, topic, brandName, score);
    
    // Store insights
    for (const text of insightTexts) {
      await supabase.from('insights').insert({
        brand_id: brandId,
        run_id: runId,
        type: 'quick_win',
        text: text,
        created_at: new Date().toISOString()
      });
    }

    // Update brand
    await supabase
      .from('brands')
      .update({
        visibility_score: score,
        last_run: new Date().toISOString()
      })
      .eq('id', brandId);

    console.log(`✓ Analysis complete! Score: ${score}, Mentions: ${results.filter(r => r.mentioned).length}/${queries.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        score,
        mentions: results.filter(r => r.mentioned).length,
        totalQueries: results.length,
        runId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
