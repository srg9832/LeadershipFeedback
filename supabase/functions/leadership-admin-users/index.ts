import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const clean = (v: unknown) => String(v ?? "").trim();
const bool = (roles: string[], role: string) => roles.includes(role);

async function allAuthUsers(admin: any) {
  const out: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const rows = data?.users ?? [];
    out.push(...rows);
    if (rows.length < 1000) break;
    page += 1;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const callerClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return json({ error: "Invalid session" }, 401);
    const callerId = callerData.user.id;

    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
    const body = await req.json();
    const action = clean(body.action || "list");
    const unitId = clean(body.unitId || body.unit_id) || null;

    const { data: gp } = await admin.from("leadership_global_permissions")
      .select("is_app_admin,encampment_evaluator,encampment_reviewer,encampment_admin")
      .eq("user_id", callerId).maybeSingle();
    const callerIsAppAdmin = !!gp?.is_app_admin;

    const { data: callerUnitRows } = await admin.from("leadership_unit_permissions")
      .select("unit_id,unit_admin")
      .eq("user_id", callerId).eq("unit_admin", true);
    const callerAdminUnits = new Set((callerUnitRows ?? []).map((r: any) => r.unit_id));

    const requireUnitAdmin = () => {
      if (!unitId) throw new Error("A unit is required for this action");
      if (!callerIsAppAdmin && !callerAdminUnits.has(unitId)) {
        const err: any = new Error("You are not authorized to administer this unit");
        err.status = 403;
        throw err;
      }
    };

    if (action === "list") {
      requireUnitAdmin();

      const ids = new Set<string>();
      const { data: unitPermRows, error: unitPermError } = await admin.from("leadership_unit_permissions")
        .select("user_id,cadet_evaluator,cadet_reviewer,senior_evaluator,senior_reviewer,unit_admin")
        .eq("unit_id", unitId);
      if (unitPermError) throw unitPermError;
      for (const r of unitPermRows ?? []) ids.add(r.user_id);

      if (callerIsAppAdmin) {
        const { data: globalRows } = await admin.from("leadership_global_permissions").select("user_id");
        for (const g of globalRows ?? []) ids.add(g.user_id);
      } else {
        // Leadership Unit Admins may see shared CAP Applications users already associated
        // with the selected unit in another app, without exposing the wing-wide Auth directory.
        const [
          schedulePermResult,
          uniformPermResult,
          drillPermResult,
          defaultProfileResult,
        ] = await Promise.all([
          admin.from("user_unit_permissions").select("user_id").eq("unit_id", unitId),
          admin.from("uniform_unit_permissions").select("user_id").eq("unit_id", unitId),
          admin.from("drill_unit_permissions").select("user_id,revoked_at,expires_at").eq("unit_id", unitId),
          admin.from("profiles").select("id").eq("default_unit_id", unitId),
        ]);
        if (schedulePermResult.error) throw schedulePermResult.error;
        if (uniformPermResult.error) throw uniformPermResult.error;
        if (drillPermResult.error) throw drillPermResult.error;
        if (defaultProfileResult.error) throw defaultProfileResult.error;
        for (const p of schedulePermResult.data ?? []) ids.add(p.user_id);
        for (const p of uniformPermResult.data ?? []) ids.add(p.user_id);
        for (const p of drillPermResult.data ?? []) {
          const active = !p.revoked_at && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now());
          if (active) ids.add(p.user_id);
        }
        for (const p of defaultProfileResult.data ?? []) ids.add(p.id);
      }
      ids.add(callerId);

      const authUsers = await allAuthUsers(admin);
      // Leadership App Admins administer the whole application, so show the complete
      // shared CAP Applications Auth directory. Roles displayed below remain scoped to
      // the currently selected Leadership unit plus any application-wide Leadership roles.
      if (callerIsAppAdmin) for (const u of authUsers) ids.add(u.id);

      const authById = new Map(authUsers.map((u: any) => [u.id, u]));
      const idList = [...ids];
      if (!idList.length) return json({ users: [] });

      const { data: profiles } = await admin.from("profiles")
        .select("id,display_name,member_id,default_unit_id").in("id", idList);
      const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const unitPermById = new Map((unitPermRows ?? []).map((p: any) => [p.user_id, p]));

      let globalById = new Map<string, any>();
      if (callerIsAppAdmin) {
        const { data: globals } = await admin.from("leadership_global_permissions")
          .select("user_id,is_app_admin,encampment_evaluator,encampment_reviewer,encampment_admin")
          .in("user_id", idList);
        globalById = new Map((globals ?? []).map((g: any) => [g.user_id, g]));
      }

      const users = idList.map((id) => {
        const au: any = authById.get(id);
        const p: any = profileById.get(id);
        const up: any = unitPermById.get(id) ?? {};
        const gl: any = globalById.get(id) ?? {};
        const roles: string[] = [];
        if (up.cadet_evaluator) roles.push("cadetEvaluator");
        if (up.cadet_reviewer) roles.push("cadetReviewer");
        if (up.senior_evaluator) roles.push("seniorEvaluator");
        if (up.senior_reviewer) roles.push("seniorReviewer");
        if (up.unit_admin) roles.push("unitAdmin");
        if (callerIsAppAdmin && gl.encampment_evaluator) roles.push("encampmentEvaluator");
        if (callerIsAppAdmin && gl.encampment_reviewer) roles.push("encampmentReviewer");
        if (callerIsAppAdmin && gl.encampment_admin) roles.push("encampmentAdmin");
        if (callerIsAppAdmin && gl.is_app_admin) roles.push("appAdmin");
        return {
          id,
          email: au?.email ?? "",
          displayName: p?.display_name ?? au?.user_metadata?.display_name ?? "",
          capid: m?.capid ?? "",
          firstName: m?.first_name ?? "",
          lastName: m?.last_name ?? "",
          memberType: m?.member_type ?? "",
          memberLinked: !!m,
          memberActive: m?.active ?? true,
          memberId: m?.id ?? null,
          unitId,
          roles,
        };
      }).sort((a, b) => (a.lastName || a.displayName).localeCompare(b.lastName || b.displayName));

      return json({ users });
    }

    if (action === "save") {
      requireUnitAdmin();

      const userIdInput = clean(body.userId || body.user_id) || null;
      const email = clean(body.email).toLowerCase();
      const password = clean(body.password);
      const displayName = clean(body.displayName || body.display_name);
      const roles = Array.isArray(body.roles) ? body.roles.map(clean) : [];

      if (!email || !displayName) throw new Error("Display name and email are required");

      const globalRoles = ["appAdmin", "encampmentEvaluator", "encampmentReviewer", "encampmentAdmin"];
      if (!callerIsAppAdmin && globalRoles.some((r) => roles.includes(r))) {
        const err: any = new Error("Only a Leadership App Admin can assign application-wide or encampment roles");
        err.status = 403;
        throw err;
      }

      const authUsers = await allAuthUsers(admin);
      let target: any = userIdInput ? authUsers.find((u: any) => u.id === userIdInput) : null;
      if (userIdInput && !target) throw new Error("User account not found");
      if (!target) target = authUsers.find((u: any) => (u.email ?? "").toLowerCase() === email);

      // A local Unit Admin may manage only shared users already associated with the
      // selected unit in at least one CAP Applications module.
      let targetManagedInSelectedUnit = false;
      if (target && !callerIsAppAdmin) {
        const { data: targetLocalPerm, error: targetLocalPermError } = await admin.from("leadership_unit_permissions")
          .select("user_id").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle();
        if (targetLocalPermError) throw targetLocalPermError;

        const { data: targetProfileForAccess, error: targetProfileForAccessError } = await admin.from("profiles")
          .select("member_id,default_unit_id").eq("id", target.id).maybeSingle();
        if (targetProfileForAccessError) throw targetProfileForAccessError;

        const [
          schedulePermResult,
          uniformPermResult,
          drillPermResult,
        ] = await Promise.all([
          admin.from("user_unit_permissions").select("user_id").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle(),
          admin.from("uniform_unit_permissions").select("user_id").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle(),
          admin.from("drill_unit_permissions").select("user_id,revoked_at,expires_at").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle(),
        ]);
        if (schedulePermResult.error) throw schedulePermResult.error;
        if (uniformPermResult.error) throw uniformPermResult.error;
        if (drillPermResult.error) throw drillPermResult.error;

        const drillPerm = drillPermResult.data;
        const activeDrillPerm = !!drillPerm && !drillPerm.revoked_at
          && (!drillPerm.expires_at || new Date(drillPerm.expires_at).getTime() > Date.now());

        targetManagedInSelectedUnit = !!targetLocalPerm
          || !!schedulePermResult.data || !!uniformPermResult.data || activeDrillPerm
          || targetProfileForAccess?.default_unit_id === unitId || target.id === callerId;

        if (!targetManagedInSelectedUnit) {
          const err: any = new Error("That shared CAP Applications login is not associated with this unit. A Leadership App Admin must link it first.");
          err.status = 403;
          throw err;
        }
      }

      // Reuse a shared account by email when possible; only create a new Auth user when
      // the email is not already present in CAP Applications.
      if (!target) {
        if (!password) throw new Error("A temporary password is required only when creating a brand-new shared CAP Applications account");
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });
        if (error) throw error;
        target = data.user;
      } else {
        const attrs: any = {
          user_metadata: { ...(target.user_metadata ?? {}), display_name: displayName },
        };
        if (callerIsAppAdmin || targetManagedInSelectedUnit) {
          attrs.email = email;
          if (password) attrs.password = password;
        }
        const { data, error } = await admin.auth.admin.updateUserById(target.id, attrs);
        if (error) throw error;
        target = data.user;
      }

      const { data: profileBefore, error: profileBeforeError } = await admin.from("profiles")
        .select("id,member_id,default_unit_id").eq("id", target.id).maybeSingle();
      if (profileBeforeError) throw profileBeforeError;

      // Leadership permissions are administrative designations. They are intentionally
      // independent from the shared CAP member roster and CAPID/member linkage.
      const profileUpdate: any = { display_name: displayName };
      if (!profileBefore?.default_unit_id) profileUpdate.default_unit_id = unitId;

      if (profileBefore) {
        const { error } = await admin.from("profiles").update(profileUpdate).eq("id", target.id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("profiles").insert({
          id: target.id,
          display_name: displayName,
          is_app_admin: false,
          default_unit_id: unitId,
        });
        if (error) throw error;
      }

      const { error: unitPermError } = await admin.from("leadership_unit_permissions").upsert({
        user_id: target.id,
        unit_id: unitId,
        cadet_evaluator: bool(roles, "cadetEvaluator"),
        cadet_reviewer: bool(roles, "cadetReviewer"),
        senior_evaluator: bool(roles, "seniorEvaluator"),
        senior_reviewer: bool(roles, "seniorReviewer"),
        unit_admin: bool(roles, "unitAdmin"),
      }, { onConflict: "user_id,unit_id" });
      if (unitPermError) throw unitPermError;

      if (callerIsAppAdmin) {
        const { data: targetGlobalBefore, error: targetGlobalBeforeError } = await admin.from("leadership_global_permissions")
          .select("is_app_admin").eq("user_id", target.id).maybeSingle();
        if (targetGlobalBeforeError) throw targetGlobalBeforeError;

        if (targetGlobalBefore?.is_app_admin && !bool(roles, "appAdmin")) {
          const { count, error: countError } = await admin.from("leadership_global_permissions")
            .select("user_id", { count: "exact", head: true }).eq("is_app_admin", true);
          if (countError) throw countError;
          if ((count ?? 0) <= 1) throw new Error("You cannot remove the last Leadership App Admin");
        }

        const { error: globalError } = await admin.from("leadership_global_permissions").upsert({
          user_id: target.id,
          is_app_admin: bool(roles, "appAdmin"),
          encampment_evaluator: bool(roles, "encampmentEvaluator"),
          encampment_reviewer: bool(roles, "encampmentReviewer"),
          encampment_admin: bool(roles, "encampmentAdmin"),
        }, { onConflict: "user_id" });
        if (globalError) throw globalError;
      }

      await admin.from("leadership_audit_log").insert({
        actor_user_id: callerId,
        action: userIdInput ? "UPDATE_USER" : "SAVE_USER",
        entity_type: "user",
        entity_id: target.id,
        details: { unit_id: unitId, roles, shared_account: true },
      });

      return json({ ok: true, userId: target.id });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error(error);
    const status = Number((error as any)?.status || 400);
    return json({ error: (error as Error).message || "Request failed" }, status);
  }
});
