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

      // Include linked login users whose current primary member assignment is the selected unit.
      const { data: memberRows, error: memberError } = await admin.from("member_unit_assignments")
        .select("member_id").eq("unit_id", unitId).eq("active", true).eq("is_primary", true);
      if (memberError) throw memberError;
      const memberIds = (memberRows ?? []).map((r: any) => r.member_id);
      if (memberIds.length) {
        const { data: profileRows } = await admin.from("profiles").select("id").in("member_id", memberIds);
        for (const p of profileRows ?? []) ids.add(p.id);
      }

      if (callerIsAppAdmin) {
        const { data: globalRows } = await admin.from("leadership_global_permissions").select("user_id");
        for (const g of globalRows ?? []) ids.add(g.user_id);
      }
      ids.add(callerId);

      const authUsers = await allAuthUsers(admin);
      const authById = new Map(authUsers.map((u: any) => [u.id, u]));
      const idList = [...ids];
      if (!idList.length) return json({ users: [] });

      const { data: profiles } = await admin.from("profiles")
        .select("id,display_name,member_id,default_unit_id").in("id", idList);
      const memberLinkIds = (profiles ?? []).map((p: any) => p.member_id).filter(Boolean);
      const { data: members } = memberLinkIds.length
        ? await admin.from("members").select("id,capid,first_name,last_name,member_type,active").in("id", memberLinkIds)
        : { data: [] as any[] };
      const memberById = new Map((members ?? []).map((m: any) => [m.id, m]));
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
        const m: any = p?.member_id ? memberById.get(p.member_id) : null;
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
          memberType: m?.member_type ?? "Senior",
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
      const capid = clean(body.capid);
      const firstName = clean(body.firstName || body.first_name);
      const lastName = clean(body.lastName || body.last_name);
      const memberType = clean(body.memberType || body.member_type);
      const roles = Array.isArray(body.roles) ? body.roles.map(clean) : [];

      if (!email || !capid || !firstName || !lastName) throw new Error("Email, CAPID, first name, and last name are required");
      if (!["Cadet", "Senior"].includes(memberType)) throw new Error("Member Type must be Cadet or Senior");
      if (memberType === "Cadet" && (bool(roles, "seniorEvaluator") || bool(roles, "seniorReviewer"))) {
        throw new Error("Cadet accounts cannot receive Senior permissions");
      }

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
      const targetAlreadyExisted = !!target;

      // A local Unit Admin may edit only users already attached to the selected unit.
      // They may still LINK an existing account by email, but cannot submit an arbitrary
      // Auth UUID and take over an unrelated user.
      let targetManagedInSelectedUnit = false;
      if (target && !callerIsAppAdmin) {
        const { data: targetLocalPerm, error: targetLocalPermError } = await admin.from("leadership_unit_permissions")
          .select("user_id").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle();
        if (targetLocalPermError) throw targetLocalPermError;

        const { data: targetProfileForAccess, error: targetProfileForAccessError } = await admin.from("profiles")
          .select("member_id,default_unit_id").eq("id", target.id).maybeSingle();
        if (targetProfileForAccessError) throw targetProfileForAccessError;
        let memberInUnit = false;
        if (targetProfileForAccess?.member_id) {
          const { data: targetAssignment, error: targetAssignmentError } = await admin.from("member_unit_assignments")
            .select("id").eq("member_id", targetProfileForAccess.member_id).eq("unit_id", unitId)
            .eq("active", true).eq("is_primary", true).maybeSingle();
          if (targetAssignmentError) throw targetAssignmentError;
          memberInUnit = !!targetAssignment;
        }
        const { data: schedulePerm, error: schedulePermError } = await admin.from("user_unit_permissions")
          .select("user_id").eq("user_id", target.id).eq("unit_id", unitId).maybeSingle();
        if (schedulePermError) throw schedulePermError;

        targetManagedInSelectedUnit = !!targetLocalPerm || memberInUnit || !!schedulePerm
          || targetProfileForAccess?.default_unit_id === unitId || target.id === callerId;
        if (!targetManagedInSelectedUnit) {
          const err: any = new Error("That existing login is not associated with this unit. A Leadership App Admin must link it first.");
          err.status = 403;
          throw err;
        }
      }

      const displayName = `${firstName} ${lastName}`.trim();
      if (!target) {
        if (!password) throw new Error("An initial password is required for a new user");
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });
        if (error) throw error;
        target = data.user;
      } else {
        // Existing login: App Admins may maintain credentials. A local Unit Admin may
        // maintain credentials only for a user already managed in that unit. When the
        // account is merely being linked by email for the first time, preserve its login
        // email/password and only update display metadata.
        const attrs: any = { user_metadata: { ...(target.user_metadata ?? {}), display_name: displayName } };
        if (callerIsAppAdmin || targetManagedInSelectedUnit) {
          attrs.email = email;
          if (password) attrs.password = password;
        }
        const { data, error } = await admin.auth.admin.updateUserById(target.id, attrs);
        if (error) throw error;
        target = data.user;
      }

      // Shared member record keyed by CAPID. If the login is already linked to a member,
      // editing a CAPID corrects that same member record instead of creating an orphan duplicate.
      const { data: byCapid, error: byCapidError } = await admin.from("members")
        .select("id,capid,member_type,active").eq("capid", capid).maybeSingle();
      if (byCapidError) throw byCapidError;

      const { data: profileBefore, error: profileBeforeError } = await admin.from("profiles")
        .select("member_id,default_unit_id").eq("id", target.id).maybeSingle();
      if (profileBeforeError) throw profileBeforeError;

      let memberId = profileBefore?.member_id ?? byCapid?.id ?? null;
      if (profileBefore?.member_id && byCapid && profileBefore.member_id !== byCapid.id) {
        throw new Error("That CAPID already belongs to another member");
      }

      // Validate any unit transfer before changing the shared roster. This prevents a local
      // Unit Admin from taking a member from a unit they do not administer.
      if (memberId) {
        const { data: assignmentForAuth, error: assignmentForAuthError } = await admin.from("member_unit_assignments")
          .select("id,unit_id,start_date").eq("member_id", memberId).eq("active", true).eq("is_primary", true)
          .order("start_date", { ascending: false }).limit(1).maybeSingle();
        if (assignmentForAuthError) throw assignmentForAuthError;
        if (assignmentForAuth && assignmentForAuth.unit_id !== unitId && !callerIsAppAdmin && !callerAdminUnits.has(assignmentForAuth.unit_id)) {
          const err: any = new Error("This member is currently assigned to another unit that you do not administer");
          err.status = 403;
          throw err;
        }
      }

      if (memberId) {
        const { error } = await admin.from("members").update({
          capid,
          first_name: firstName,
          last_name: lastName,
          member_type: memberType,
          active: true,
        }).eq("id", memberId);
        if (error) throw error;
      } else {
        const { data, error } = await admin.from("members").insert({
          capid, first_name: firstName, last_name: lastName, member_type: memberType, active: true,
        }).select("id").single();
        if (error) throw error;
        memberId = data.id;
      }

      const { data: currentAssignment } = await admin.from("member_unit_assignments")
        .select("id,unit_id,start_date").eq("member_id", memberId).eq("active", true).eq("is_primary", true)
        .order("start_date", { ascending: false }).limit(1).maybeSingle();

      if (currentAssignment && currentAssignment.unit_id !== unitId) {
        if (!callerIsAppAdmin && !callerAdminUnits.has(currentAssignment.unit_id)) {
          const err: any = new Error("This member is currently assigned to another unit that you do not administer");
          err.status = 403;
          throw err;
        }
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const endDate = currentAssignment.start_date > yesterday ? currentAssignment.start_date : yesterday;
        const { error } = await admin.from("member_unit_assignments")
          .update({ active: false, end_date: endDate }).eq("id", currentAssignment.id);
        if (error) throw error;
      }
      if (!currentAssignment || currentAssignment.unit_id !== unitId) {
        const { error } = await admin.from("member_unit_assignments").insert({
          member_id: memberId, unit_id: unitId, is_primary: true, active: true,
        });
        if (error) throw error;
      }

      // Profile is shared with CAP Schedule. Do not remove existing schedule permissions.
      const profileUpdate: any = { display_name: displayName, member_id: memberId };
      if (!profileBefore?.default_unit_id) profileUpdate.default_unit_id = unitId;
      const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", target.id);
      if (profileError) throw profileError;

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
        details: { unit_id: unitId, capid, roles },
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
