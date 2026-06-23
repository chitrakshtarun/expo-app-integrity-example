// iOS App Attest verification using `node-app-attest`, which implements Apple's
// attestation/assertion protocol on top of Node's crypto + cbor.
import { verifyAssertion, verifyAttestation } from "node-app-attest";

import { getAttestedKey, saveAttestedKey, updateSignCount } from "@/helpers/store";

type IosAttestInput = {
  keyId: string;
  attestation: string; // base64
  challenge: string;
};

type IosAssertInput = {
  keyId: string;
  assertion: string; // base64
  challenge: string;
};

export function verifyIosAttestation({ keyId, attestation, challenge }: IosAttestInput) {
  const { publicKey } = verifyAttestation({
    attestation: Buffer.from(attestation, "base64"),
    challenge,
    keyId,
    bundleIdentifier: requireEnv("IOS_BUNDLE_IDENTIFIER"),
    teamIdentifier: requireEnv("IOS_TEAM_IDENTIFIER"),
    allowDevelopmentEnvironment: process.env.IOS_ALLOW_DEVELOPMENT_ENVIRONMENT === "true",
  });

  // Persist the public key so future assertions can be verified without
  // re-attesting (signCount starts at 0).
  saveAttestedKey(keyId, publicKey);

  return { verified: true, keyId };
}

export function verifyIosAssertion({ keyId, assertion, challenge }: IosAssertInput) {
  const stored = getAttestedKey(keyId);
  if (!stored) {
    throw new Error("unknown keyId — attest the key before sending assertions");
  }

  // The native module signs SHA-256(challenge), so the assertion payload is the
  // challenge string itself.
  const { signCount } = verifyAssertion({
    assertion: Buffer.from(assertion, "base64"),
    payload: challenge,
    publicKey: stored.publicKey,
    bundleIdentifier: requireEnv("IOS_BUNDLE_IDENTIFIER"),
    teamIdentifier: requireEnv("IOS_TEAM_IDENTIFIER"),
    signCount: stored.signCount,
  });

  updateSignCount(keyId, signCount);

  return { verified: true, keyId, signCount };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing env var: ${name}`);
  return value;
}
