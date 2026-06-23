import type { playintegrity_v1 } from "@googleapis/playintegrity";

// Validates a decoded Play Integrity verdict against the original request.
// Ported from the reference push-notifications-service.
export function isValidAndroidRequest(
  requestDetails: playintegrity_v1.Schema$RequestDetails | null | undefined,
  appIntegrity: playintegrity_v1.Schema$AppIntegrity | null | undefined,
  deviceIntegrity: playintegrity_v1.Schema$DeviceIntegrity | null | undefined,
  packageName: string,
  challenge: string
): boolean {
  if (!requestDetails || !appIntegrity || !deviceIntegrity) {
    return false;
  }

  const timestampMillis =
    typeof requestDetails.timestampMillis === "string"
      ? parseInt(requestDetails.timestampMillis, 10)
      : requestDetails.timestampMillis;

  return (
    requestDetails.requestPackageName?.toLowerCase() ===
      packageName.toLowerCase() &&
    typeof timestampMillis === "number" &&
    !isNaN(timestampMillis) &&
    Date.now() - timestampMillis < 120000 &&
    requestDetails.requestHash === challenge &&
    appIntegrity.appRecognitionVerdict === "PLAY_RECOGNIZED" &&
    (deviceIntegrity.deviceRecognitionVerdict?.includes(
      "MEETS_DEVICE_INTEGRITY"
    ) ??
      false)
  );
}
