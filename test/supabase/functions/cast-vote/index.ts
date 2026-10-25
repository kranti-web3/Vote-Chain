import { createClient } from "npm:@supabase/supabase-js@2";
import { Group } from "npm:@semaphore-protocol/group@4";
import { verifyProof } from "npm:@semaphore-protocol/proof@4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sha256Field(s: string) {            // must match the client helper exactly
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return BigInt("0x" + [...d].map(b => b.toString(16).padStart(2, "0")).join("")) >> 8n;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { electionId, proof, ciphertext } = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: e } = await admin.from("elections").select("*").eq("id", electionId).single();
    const now = new Date();
    if (!e || now <= new Date(e.registration_ends_at) || now >= new Date(e.ends_at)) throw new Error("Voting is not open");

    const { data: rows } = await admin.from("election_members").select("commitment").eq("election_id", electionId).order("idx");
    const group = new Group(rows!.map(r => BigInt(r.commitment)));
    const scope = BigInt("0x" + electionId.replaceAll("-", ""));
    if (group.root.toString() !== proof.merkleTreeRoot || proof.scope !== scope.toString())
      throw new Error("Proof does not match this election");
    if (!(await verifyProof(proof))) throw new Error("Invalid proof");

    let option: string | null = null, cipher: string | null = null;
    if (e.reveal_mode === "timelock") {
      if (BigInt(proof.message) !== await sha256Field(ciphertext)) throw new Error("Ciphertext does not match proof");
      cipher = ciphertext;
    } else {
      const { data: o } = await admin.from("options").select("id").eq("election_id", electionId).eq("position", Number(proof.message)).single();
      if (!o) throw new Error("Unknown option");
      option = o.id;
    }
    const { error } = await admin.rpc("append_vote", { p_election: electionId, p_option: option,
      p_nullifier: proof.nullifier, p_cipher: cipher, p_proof: proof });
    if (error) throw new Error(error.code === "23505" ? "This identity has already voted" : error.message);
    return json({ ok: true });
  } catch (err) { return json({ error: (err as Error).message }, 400); }
});