/**
 * config.ts — Endereço do servidor do saguão.
 *
 * ⚠️ IMPORTANTE em dispositivo físico:
 *   "localhost" aponta para o PRÓPRIO celular, não para o seu PC. Use o IP da
 *   sua máquina na rede local, ex.: ws://192.168.0.12:8080 — ou defina a env
 *   pública do Expo `EXPO_PUBLIC_PONG_SERVER` (lida automaticamente abaixo).
 *
 *   # no terminal, antes de `expo start`:
 *   EXPO_PUBLIC_PONG_SERVER=ws://192.168.0.12:8080 npx expo start
 *
 * No emulador Android use ws://10.0.2.2:8080; no simulador iOS, ws://localhost:8080.
 */

export const SERVER_URL: string =
  process.env.EXPO_PUBLIC_PONG_SERVER?.trim() || "ws://162.120.185.213:8080";

/** Frequência de envio do estado/input em ms (~30 Hz). */
export const NET_TICK_MS = 33;
