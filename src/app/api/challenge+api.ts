import { createChallenge } from "@/helpers/store";

// GET /api/challenge -> { challenge }
//
// The client sends `challenge` to App Attest / Play Integrity, then returns the
// same `challenge` to /api/verify, which validates and consumes it.
export function GET() {
  return Response.json(createChallenge());
}
