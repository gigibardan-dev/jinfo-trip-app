import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    // Verify caller (must be admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const token = authHeader.replace("Bearer ", "");

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) throw new Error("Unauthorized");

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      throw new Error("User is not an admin");
    }

    const body = await req.json();
    const userId = String(body?.userId ?? "").trim();
    const isActive = Boolean(body?.isActive);
    if (!userId) throw new Error("userId is required");

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId)
      .select("id, is_active")
      .maybeSingle();

    if (updateErr) throw updateErr;
    if (!updated?.id) throw new Error("No rows updated (user not found)");

    return new Response(
      JSON.stringify({ success: true, profile: updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Error in admin-set-user-active:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
