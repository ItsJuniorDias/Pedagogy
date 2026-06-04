import { useEffect } from "react";

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

// Impede que a splash screen suma antes das fontes carregarem
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  // Esconde a splash screen somente depois que as fontes carregaram
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Enquanto as fontes não carregam, não renderiza nada (splash ainda visível)
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="(app)/index" options={{ headerShown: false }} />

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
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
