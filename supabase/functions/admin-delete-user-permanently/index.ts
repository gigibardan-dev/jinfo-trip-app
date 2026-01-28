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
    if (!userId) throw new Error("userId is required");

    // Verify target user exists and is a tourist
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, nume, prenume")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!targetProfile) throw new Error("User not found");
    if (targetProfile.role !== "tourist") {
      throw new Error("Can only permanently delete tourist accounts");
    }

    const deletedEmail = targetProfile.email;
    const deletedName = `${targetProfile.nume} ${targetProfile.prenume}`;

    // Hard delete from auth.users (this will cascade to profiles via FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) throw deleteError;

    console.log(`User ${userId} (${deletedEmail}) permanently deleted by admin ${userRes.user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedEmail,
        deletedName,
        message: `User ${deletedEmail} has been permanently deleted` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Error in admin-delete-user-permanently:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
