// Android Play Integrity verification. The standard-request token is decoded
// server-to-server by Google's Play Integrity API using a service account, then
// the verdict is validated. See:
// https://developer.android.com/google/play/integrity/standard
import { auth as googleAuth, playintegrity } from "@googleapis/playintegrity";

import { isValidAndroidRequest } from "@/helpers/is-valid-android-request";

let authClient: ReturnType<typeof createAuthClient> | null = null;

function createAuthClient() {
  return new googleAuth.GoogleAuth({
    keyFile: requireEnv("GOOGLE_APPLICATION_CREDENTIALS"),
    scopes: ["https://www.googleapis.com/auth/playintegrity"],
  });
}

function getAuthClient() {
  if (!authClient) authClient = createAuthClient();
  return authClient;
}

type AndroidInput = {
  token: string;
  challenge: string; // bound into the token as the request hash
};

export async function verifyAndroidToken({ token, challenge }: AndroidInput) {
  const packageName = requireEnv("GOOGLE_PLAY_APP_PACKAGE_NAME");

  const client = playintegrity({ version: "v1", auth: getAuthClient() });
  const result = await client.v1.decodeIntegrityToken({
    packageName,
    requestBody: { integrityToken: token },
  });

  const payload = result.data?.tokenPayloadExternal;
  if (!payload) {
    throw new Error("no payload returned from Play Integrity");
  }

  const { requestDetails, appIntegrity, deviceIntegrity } = payload;
  if (!isValidAndroidRequest(requestDetails, appIntegrity, deviceIntegrity, packageName, challenge)) {
    throw new Error("Play Integrity verdict failed validation");
  }

  return {
    verified: true,
    appRecognitionVerdict: appIntegrity?.appRecognitionVerdict,
    deviceRecognitionVerdict: deviceIntegrity?.deviceRecognitionVerdict,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing env var: ${name}`);
  return value;
}
