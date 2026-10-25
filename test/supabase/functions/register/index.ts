import { createClient } from "npm:@supabase/supabase-js@2";
import { createPublicClient, http, verifyMessage, erc20Abi } from "npm:viem@2";
import * as chains from "npm:viem@2/chains";

const cors = { "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authed = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization")! } } });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) throw new Error("Sign in first");

    const { electionId, commitment, wallet, signature } = await req.json();
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: e } = await admin.from("elections").select("*").eq("id", electionId).single();
    if (!e) throw new Error("Election not found");
    if (new Date(e.registration_ends_at) <= new Date()) throw new Error("Registration is closed");

    let walletAddr: string | null = null;
    if (e.gate_contract) {
      const message = `VoteChain registration\nElection: ${electionId}\nUser: ${user.id}\nCommitment: ${commitment}`;
      if (!(await verifyMessage({ address: wallet, message, signature }))) throw new Error("Wallet signature is invalid");
      const chain = Object.values(chains).find((c: any) => c?.id === e.gate_chain_id) as any;
      const pc = createPublicClient({ chain, transport: http(Deno.env.get(`RPC_URL_${e.gate_chain_id}`)!) });
      // balanceOf(address) is the same for ERC-20 and ERC-721
      const bal = await pc.readContract({ address: e.gate_contract, abi: erc20Abi, functionName: "balanceOf",
        args: [wallet], blockNumber: BigInt(e.snapshot_block) });
      if (bal < BigInt(e.gate_min_balance)) throw new Error("Not enough tokens at the snapshot block");
      walletAddr = wallet.toLowerCase();
    }
    const { error } = await admin.from("election_members")
      .insert({ election_id: electionId, user_id: user.id, commitment, wallet: walletAddr });
    if (error) throw new Error(error.code === "23505" ? "Already registered (account or wallet)" : error.message);
    return json({ ok: true });
  } catch (err) { return json({ error: (err as Error).message }, 400); }
});