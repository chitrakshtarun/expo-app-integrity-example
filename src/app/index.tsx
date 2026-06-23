import * as AppIntegrity from "@expo/app-integrity";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Public URL of the deployed Node server running the API routes. Leave empty to
// use the dev server (relative requests). Required for device/production builds.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const CLOUD_PROJECT_NUMBER = process.env.EXPO_PUBLIC_CLOUD_PROJECT_NUMBER ?? "";

// SecureStore key under which the attested App Attest key identifier is kept.
const KEY_ID_STORE = "appattest.keyId";

async function getChallenge(): Promise<{ challenge: string }> {
  const res = await fetch(`${API_URL}/api/challenge`);
  if (!res.ok) throw new Error(`challenge failed: ${res.status}`);
  return res.json();
}

async function verify(body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `verify failed: ${res.status}`);
  return json;
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // The attested keyId, restored from SecureStore. When set, assertions are
  // available without re-attesting.
  const [keyId, setKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "ios") {
      SecureStore.getItemAsync(KEY_ID_STORE).then(setKeyId).catch(() => {});
    }
  }, []);

  const append = (line: string) => setLog((prev) => [...prev, line]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setLog([]);
    try {
      await fn();
    } catch (e) {
      append(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function runAttestation() {
    append(`▶️ Attesting on ${Platform.OS}…`);
    if (!AppIntegrity.isSupported) {
      append("❌ App Attest is not supported on this device.");
      return;
    }

    const newKeyId = await AppIntegrity.generateKeyAsync();
    append(`🔑 keyId: ${newKeyId}`);

    const { challenge } = await getChallenge();
    const attestation = await AppIntegrity.attestKeyAsync(newKeyId, challenge);
    append("📤 sending attestation to server…");
    const result = await verify({
      kind: "ios-attest",
      challenge,
      keyId: newKeyId,
      attestation,
    });
    append(`✅ attestation verified: ${JSON.stringify(result)}`);

    // Persist the attested key so assertions can use it later.
    await SecureStore.setItemAsync(KEY_ID_STORE, newKeyId);
    setKeyId(newKeyId);
    append("💾 keyId saved to SecureStore");
  }

  async function runAssertion() {
    const storedKeyId = await SecureStore.getItemAsync(KEY_ID_STORE);
    if (!storedKeyId) {
      append("❌ No attested key found. Run attestation first.");
      setKeyId(null);
      return;
    }
    append(`🔑 using stored keyId: ${storedKeyId}`);

    const { challenge } = await getChallenge();
    const assertion = await AppIntegrity.generateAssertionAsync(
      storedKeyId,
      challenge
    );
    append("📤 sending assertion to server…");
    const result = await verify({
      kind: "ios-assert",
      challenge,
      keyId: storedKeyId,
      assertion,
    });
    append(`✅ assertion verified: ${JSON.stringify(result)}`);
  }

  async function runAndroid() {
    append("▶️ Running integrity check on android…");
    if (!CLOUD_PROJECT_NUMBER) {
      append("❌ Set EXPO_PUBLIC_CLOUD_PROJECT_NUMBER in your .env first.");
      return;
    }
    await AppIntegrity.prepareIntegrityTokenProviderAsync(CLOUD_PROJECT_NUMBER);
    append("⚙️ integrity token provider ready");

    const { challenge } = await getChallenge();
    const token = await AppIntegrity.requestIntegrityCheckAsync(challenge);
    append("📤 sending integrity token to server…");
    const result = await verify({ kind: "android", challenge, token });
    append(`✅ token verified: ${JSON.stringify(result)}`);
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Device & app attestation</Text>
      <Text style={styles.subtitle}>
        Run the platform integrity flow, then verify the result on the server.
      </Text>

      <View style={styles.buttons}>
        {Platform.OS === "android" ? (
          <Button
            title={busy ? "Running…" : "Run integrity check"}
            onPress={() => run(runAndroid)}
            disabled={busy}
          />
        ) : (
          <>
            <Button
              title={busy ? "Running…" : "Run attestation"}
              onPress={() => run(runAttestation)}
              disabled={busy}
            />
            {keyId ? (
              <Button
                title={busy ? "Running…" : "Run assertion"}
                onPress={() => run(runAssertion)}
                disabled={busy}
              />
            ) : null}
          </>
        )}
      </View>

      <ScrollView style={styles.log} contentContainerStyle={styles.logContent}>
        {log.length === 0 ? (
          <Text style={styles.placeholder}>Results will appear here.</Text>
        ) : (
          log.map((line, i) => (
            <Text key={i} style={styles.logLine} selectable>
              {line}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
  },
  buttons: {
    gap: 8,
  },
  log: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  logContent: {
    padding: 12,
    gap: 6,
  },
  placeholder: {
    color: "#999",
  },
  logLine: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    fontSize: 12,
  },
});
