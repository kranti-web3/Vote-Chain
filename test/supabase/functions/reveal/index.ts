import { createClient } from "npm:@supabase/supabase-js@2";
import { timelockDecrypt, mainnetClient } from "npm:tlock-js";

Deno.serve(async (req) => {
  const { electionId } = await req.json();
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: e } = await admin.from("elections").select("ends_at").eq("id", electionId).single();
  if (!e || new Date(e.ends_at) > new Date()) return new Response("Not closed yet", { status: 400 });

  const { data: opts } = await admin.from("options").select("id").eq("election_id", electionId);
  const valid = new Set(opts!.map(o => o.id));
  const { data: pending } = await admin.from("votes").select("id,ciphertext")
    .eq("election_id", electionId).is("option_id", null).not("ciphertext", "is", null);

  const client = mainnetClient();
  let revealed = 0;
  for (const v of pending ?? []) {
    try {
      const choice = String(await timelockDecrypt(v.ciphertext, client)).trim();
      if (valid.has(choice)) { await admin.from("votes").update({ option_id: choice }).eq("id", v.id); revealed++; }
    } catch { /* garbled or too early: leave as a spoiled ballot */ }
  }
  return new Response(JSON.stringify({ revealed }), { headers: { "Content-Type": "application/json" } });
});