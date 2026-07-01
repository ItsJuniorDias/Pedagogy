import { useEffect, useState } from "react";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import * as SplashScreen from "expo-splash-screen";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { initAnalytics } from "@/lib/analytics";

// Inicializa o i18next (efeito colateral do import) e expõe o bootstrap do
// idioma salvo/detectado.
import { bootstrapLanguage } from "@/lib/i18n";

// Impede que a splash screen suma antes das fontes carregarem
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  // Aplica o idioma salvo pelo usuário (ou o do aparelho) antes de mostrar a UI,
  // para não "piscar" o idioma padrão na primeira renderização.
  const [i18nReady, setI18nReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    bootstrapLanguage().finally(() => {
      if (mounted) setI18nReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Inicialização de analytics (no-op — sem SDK de terceiros, para cumprir a
  // categoria Kids da App Store). Mantido por compatibilidade; não pede ATT
  // nem envia dados para fora do app.
  useEffect(() => {
    void initAnalytics();
  }, []);

  // Esconde a splash screen somente depois que as fontes carregaram
  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  // Enquanto fontes/idioma não carregam, não renderiza nada (splash ainda visível)
  if (!fontsLoaded || !i18nReady) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="(app)/index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(onboarding)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen name="(details)/index" options={{ headerShown: false }} />

        <Stack.Screen name="(paywall)/index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(category)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen name="(stories)/index" options={{ headerShown: false }} />

        <Stack.Screen name="(profile)/index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(learning-all)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(games-all)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(pixel-run)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen name="(gravity)/index" options={{ headerShown: false }} />

        <Stack.Screen
          name="(farm-game)/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(ping-pong)/index"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
