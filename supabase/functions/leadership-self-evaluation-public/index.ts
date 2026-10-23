import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const clean = (v: unknown, max = 100) => String(v ?? "")
  .replace(/[\u0000-\u001F\u007F]/g, " ")
  .trim()
  .slice(0, max);

const RATINGS = new Set(["Needs Improvement", "Satisfactory", "Very Good", "Excellent"]);
const GRADE_TO_FORM: Record<string, string> = {
  "C/AB": "phase1",
  "C/Amn": "phase1",
  "C/A1C": "phase1",
  "C/SrA": "phase1",
  "C/SSgt": "phase2",
  "C/TSgt": "phase2",
  "C/MSgt": "phase2",
  "C/SMSgt": "phase2",
  "C/CMSgt": "phase2",
  "C/2d Lt": "phase3",
  "C/1st Lt": "phase3",
  "C/Capt": "phase4",
  "C/Maj": "phase4",
  "C/Lt Col": "phase4",
  "C/Col": "phase4",
};
const EXPECTED_RATINGS: Record<string, number> = { phase1: 4, phase2: 5, phase3: 7, phase4: 7 };

function validateRatings(raw: unknown, expected: number) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Complete every self-rating category");
  const ratings = raw as Record<string, unknown>;
  const cleanRatings: Record<string, string> = {};
  for (let i = 0; i < expected; i += 1) {
    const value = clean(ratings[String(i)], 40);
    if (!RATINGS.has(value)) throw new Error("Complete every self-rating category");
    cleanRatings[String(i)] = value;
  }
  return cleanRatings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) return json({ error: "Service configuration error" }, 500);

    const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json();
    const action = clean(body?.action || "", 40);

    if (action === "bootstrap") {
      const { data, error } = await admin.from("units")
        .select("id,charter_number,name")
        .eq("active", true)
        .order("charter_number", { ascending: true });
      if (error) throw error;
      return json({
        units: (data ?? []).map((u: any) => ({
          id: u.id,
          charterNumber: clean(u.charter_number, 40),
          name: clean(u.name, 160),
        })),
      });
    }

    if (action !== "submit") return json({ error: "Invalid action" }, 400);

    if (clean(body?.website, 200)) return json({ ok: true });

    const unitId = clean(body?.unitId, 80);
    const capid = clean(body?.capid, 12);
    const firstName = clean(body?.firstName, 100);
    const lastName = clean(body?.lastName, 100);
    const currentGrade = clean(body?.currentGrade, 30);
    const formType = GRADE_TO_FORM[currentGrade];

    if (!unitId) throw new Error("Select a unit");
    if (!/^[0-9]{5,8}$/.test(capid)) throw new Error("Enter a valid CAPID");
    if (!firstName || !lastName) throw new Error("First name and last name are required");
    if (!formType) throw new Error("Select a valid current grade");

    const { data: unit, error: unitError } = await admin.from("units")
      .select("id")
      .eq("id", unitId)
      .eq("active", true)
      .maybeSingle();
    if (unitError) throw unitError;
    if (!unit) throw new Error("Select an active unit");

    const selfRatings = validateRatings(body?.selfRatings, EXPECTED_RATINGS[formType]);
    const cadetSuccess = clean(body?.selfNarratives?.cadetSuccess, 8000);
    const cadetImprove = clean(body?.selfNarratives?.cadetImprove, 8000);
    if (!cadetSuccess || !cadetImprove) throw new Error("Complete both Cadet Perspective questions");

    const { error: insertError } = await admin.from("leadership_self_evaluations").insert({
      unit_id: unitId,
      capid_snapshot: capid,
      first_name_snapshot: firstName,
      last_name_snapshot: lastName,
      current_grade: currentGrade,
      form_type: formType,
      self_ratings: selfRatings,
      self_narratives: { cadetSuccess, cadetImprove },
      status: "awaiting_evaluator",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return json({
          error: "A self-evaluation request cannot be submitted right now. If you already submitted one, contact your unit's cadet programs staff.",
        }, 409);
      }
      throw insertError;
    }

    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit self-evaluation";
    return json({ error: message }, 400);
  }
});
