/**
 * config.ts — Endereço do servidor do saguão.
 *
 * Em produção o app usa o servidor hospedado no Render (wss://, SEM porta na
 * URL — o Render roteia o 443 para a porta interna do serviço).
 *
 * Para desenvolvimento local, sobrescreva com a env pública do Expo apontando
 * para o IP da sua máquina na rede (NÃO use "localhost" em celular físico):
 *
 *   # PC + celular no mesmo Wi-Fi (troque pelo IP do seu PC):
 *   EXPO_PUBLIC_PONG_SERVER=ws://192.168.1.16:8080 npx expo start --clear
 *
 *   # emulador Android: ws://10.0.2.2:8080
 *   # web / simulador iOS no mesmo PC: ws://localhost:8080
 */

/** URL de produção (Render). wss:// e SEM porta — o Render roteia o 443. */
const PROD_SERVER_URL = "wss://pedagogy-923f.onrender.com";

export const SERVER_URL: string =
  process.env.EXPO_PUBLIC_PONG_SERVER?.trim() || PROD_SERVER_URL;

/** Frequência de envio do estado/input em ms (~30 Hz). */
export const NET_TICK_MS = 33;
