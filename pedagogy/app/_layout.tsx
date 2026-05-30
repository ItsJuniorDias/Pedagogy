import { useEffect } from "react";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { initializePurchases } from "../service/purchasesService";

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // ── Inicializa RevenueCat ──────────────────────────────────────────────
    //
    // Para usuário anônimo (sem autenticação):
    initializePurchases();
  }, []);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  if (!fontsLoaded) return <AppLoading />;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="(app)/index" options={{ headerShown: false }} />

        <Stack.Screen name="(details)/index" options={{ headerShown: false }} />

        <Stack.Screen name="(paywall)/index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(pixel-run)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen name="(gravity)/index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
