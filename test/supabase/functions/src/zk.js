import { Identity, Group, generateProof } from "@semaphore-protocol/core";
import { timelockEncrypt, mainnetClient, roundAt } from "tlock-js";
import { Buffer } from "buffer";
import { sb } from "./main.js";

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function sha256Field(s) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return BigInt("0x" + [...d].map(b => b.toString(16).padStart(2, "0")).join("")) >> 8n;
}

// One identity per browser. Losing this secret means losing the ability to vote, so offer a backup.
export function getIdentity() {
  let secret = localStorage.getItem("vc-identity");
  if (!secret) {
    secret = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("vc-identity", secret);
  }
  return new Identity(secret);
}

export async function register(election, userId) {
  const commitment = getIdentity().commitment.toString();
  let wallet, signature;
  if (election.gate_contract) {
    [wallet] = await window.ethereum.request({ method: "eth_requestAccounts" });
    const message = `VoteChain registration\nElection: ${election.id}\nUser: ${userId}\nCommitment: ${commitment}`;
    signature = await window.ethereum.request({ method: "personal_sign", params: [message, wallet] });
  }
  const { error } = await sb.functions.invoke("register",
    { body: { electionId: election.id, commitment, wallet, signature } });
  if (error) throw new Error((await error.context?.json?.())?.error ?? error.message);
}

export async function castVote(election, option) {   // option = { id, position }
  const { data: commitments } = await sb.rpc("group_commitments", { p_election: election.id });
  const group = new Group(commitments.map(BigInt));
  const scope = BigInt("0x" + election.id.replaceAll("-", ""));

  let message, ciphertext = null;
  if (election.reveal_mode === "timelock") {
    const client = mainnetClient();
    // Don't trust the creator: refuse a lock round earlier than the closing time
    const minRound = roundAt(new Date(election.ends_at).getTime(), await client.chain().info());
    if (Number(election.drand_round) < minRound) throw new Error("This election would reveal votes early");
    ciphertext = await timelockEncrypt(Number(election.drand_round), Buffer.from(option.id), client);
    message = await sha256Field(ciphertext);        // binds the proof to this exact ciphertext
  } else {
    message = BigInt(option.position);
  }

  const proof = await generateProof(getIdentity(), group, message, scope);
  // Plain fetch, no user JWT, so the request carries no account identity
  const res = await fetch(`${FN}/cast-vote`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ electionId: election.id, ciphertext,
      proof: JSON.parse(JSON.stringify(proof, (_, v) => typeof v === "bigint" ? v.toString() : v)) }) });
  const out = await res.json();
  if (!res.ok) throw new Error(out.error);
}