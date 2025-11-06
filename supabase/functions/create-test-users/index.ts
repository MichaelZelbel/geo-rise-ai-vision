import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const testUsers = [
      {
        name: "Fred",
        email: "fred@free.com",
        password: "Dell@123",
        plan: "free",
        brandName: "Gary Vaynerchuck",
        topic: "Social Media",
        role: "user"
      },
      {
        name: "Peter",
        email: "peter@pro.com",
        password: "Dell@123",
        plan: "giftedPro",
        brandName: "Michael Zelbel",
        topic: "Photography",
        role: "user"
      },
      {
        name: "Benny",
        email: "benny@business.com",
        password: "Dell@123",
        plan: "giftedAgency",
        brandName: "Richard Branson",
        topic: "Entrepreneurship",
        role: "user"
      },
      {
        name: "Alice",
        email: "alice@admin.com",
        password: "Dell@123",
        plan: "giftedPro",
        brandName: "Michael Zelbel",
        topic: "AI",
        role: "admin"
      }
    ];

    const results = [];

    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        results.push({ email: userData.email, success: false, error: authError.message });
        continue;
      }

      const userId = authData.user.id;
      console.log(`Auth user created: ${userId}`);

      // Update profile with correct plan
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ plan: userData.plan })
        .eq("id", userId);

      if (profileError) {
        console.error(`Error updating profile for ${userData.email}:`, profileError);
      }

      // Create brand
      const { data: brandData, error: brandError } = await supabaseAdmin
        .from("brands")
        .insert({
          user_id: userId,
          name: userData.brandName,
          topic: userData.topic,
          visibility_score: 0
        })
        .select()
        .single();

      if (brandError) {
        console.error(`Error creating brand for ${userData.email}:`, brandError);
      }

      // Add admin role if needed
      if (userData.role === "admin") {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin"
          });

        if (roleError) {
          console.error(`Error adding admin role for ${userData.email}:`, roleError);
        }
      }

      results.push({
        email: userData.email,
        success: true,
        userId: userId,
        brandId: brandData?.id
      });

      console.log(`User ${userData.email} setup complete`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users created successfully",
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating test users:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
