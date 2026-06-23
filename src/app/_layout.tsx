import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitle: "App Integrity" }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
