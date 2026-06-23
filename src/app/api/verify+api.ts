import { consumeChallenge } from "@/helpers/store";
import { verifyAndroidToken } from "@/helpers/verify-android";
import { verifyIosAssertion, verifyIosAttestation } from "@/helpers/verify-ios";

// POST /api/verify
// Body: { kind, challenge, ...platform-specific fields }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kind, challenge } = body;

    if (!challenge || !consumeChallenge(challenge)) {
      return Response.json({ error: "challenge invalid or expired" }, { status: 400 });
    }

    switch (kind) {
      case "ios-attest":
        return Response.json(
          await verifyIosAttestation({
            keyId: body.keyId,
            attestation: body.attestation,
            challenge,
          }),
        );
      case "ios-assert":
        return Response.json(
          await verifyIosAssertion({
            keyId: body.keyId,
            assertion: body.assertion,
            challenge,
          }),
        );
      case "android":
        return Response.json(await verifyAndroidToken({ token: body.token, challenge }));
      default:
        return Response.json({ error: `unknown kind: ${kind}` }, { status: 400 });
    }
  } catch (error) {
    console.error("verify error:", error);
    return Response.json({ error: error instanceof Error ? error.message : "verification failed" }, { status: 400 });
  }
}
