import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generatePassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i++) out += charset.charAt(Math.floor(Math.random() * charset.length));
  return out;
};

serve(async (req: Request) => {
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
    const email = String(body?.email ?? "").trim();
    const nume = String(body?.nume ?? "").trim();
    const prenume = String(body?.prenume ?? "").trim();
    const telefon = typeof body?.telefon === "string" ? body.telefon.trim() : null;
    const avatar_url = typeof body?.avatar_url === "string" ? body.avatar_url.trim() : null;
    const intended_role = String(body?.intended_role ?? "tourist");
    const group_ids: string[] = Array.isArray(body?.group_ids) ? body.group_ids : [];
    // ✅ FIX: Use password from request if provided, otherwise generate random
    const password = typeof body?.password === "string" && body.password.trim().length >= 6 
      ? body.password.trim() 
      : null;

    if (!email) throw new Error("email is required");
    if (!nume) throw new Error("nume is required");
    if (!prenume) throw new Error("prenume is required");
    if (!password) throw new Error("password is required and must be at least 6 characters");

    // ✅ FIX: Use the password from admin, not random
    const tempPassword = password;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nume,
        prenume,
        telefon,
        intended_role,
      },
    });

    if (createErr || !created?.user) {
      throw createErr ?? new Error("Failed to create user");
    }

    const newUserId = created.user.id;

    // Best-effort: wait for profile trigger then update extra fields.
    // (We retry because the profile row is created by a DB trigger.)
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: updatedProfile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update({
          telefon: telefon ?? undefined,
          avatar_url: avatar_url ?? undefined,
        })
        .eq("id", newUserId)
        .select("id")
        .maybeSingle();

      if (!profileErr && updatedProfile?.id) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    // Add group memberships (optional)
    if (group_ids.length > 0) {
      const memberships = group_ids.map((gid) => ({
        group_id: gid,
        user_id: newUserId,
        role_in_group: "member",
      }));

      const { error: gmErr } = await supabaseAdmin.from("group_members").insert(memberships);
      if (gmErr) {
        // Non-fatal, but log for debugging
        console.error("Failed to insert group memberships:", gmErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Error in admin-create-user:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});