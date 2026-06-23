// In-memory stores kept on `globalThis` so they survive the Metro dev server
// re-evaluating route modules between requests (module-level `const` would reset
// on every request). State is still lost on a full process restart and is NOT
// shared across multiple server instances — a production backend would use a
// shared store (Redis / SQL), as the reference push-notifications-service does.

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type AttestedKey = { publicKey: string; signCount: number };

type IntegrityStore = {
  challenges: Map<string, number>; // challenge -> createdAt
  attestedKeys: Map<string, AttestedKey>; // keyId -> key
};

const globalRef = globalThis as unknown as {
  __appIntegrityStore?: IntegrityStore;
};

const store: IntegrityStore = (globalRef.__appIntegrityStore ??= {
  challenges: new Map(),
  attestedKeys: new Map(),
});

/** Issues a random, single-use challenge. */
export function createChallenge(): { challenge: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const challenge = btoa(String.fromCharCode(...bytes));
  store.challenges.set(challenge, Date.now());
  return { challenge };
}

/** Validates a challenge and removes it (single use). */
export function consumeChallenge(challenge: string): boolean {
  const createdAt = store.challenges.get(challenge);
  store.challenges.delete(challenge);
  if (createdAt === undefined) return false;
  return Date.now() - createdAt <= CHALLENGE_TTL_MS;
}

export function saveAttestedKey(keyId: string, publicKey: string) {
  store.attestedKeys.set(keyId, { publicKey, signCount: 0 });
}

export function getAttestedKey(keyId: string): AttestedKey | null {
  return store.attestedKeys.get(keyId) ?? null;
}

export function updateSignCount(keyId: string, signCount: number) {
  const key = store.attestedKeys.get(keyId);
  if (key) key.signCount = signCount;
}
