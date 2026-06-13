# 🛰️ NEON PONG — servidor (saguão + matchmaking)

Servidor **WebSocket** enxuto que faz três coisas:

1. **Saguão** — recebe quem entra, dá um **apelido fofo** (emoji + nick) e
   anuncia a lista de quem está esperando.
2. **Matchmaking** — assim que há **dois** jogadores na fila, casa os dois
   automaticamente (o primeiro vira **host**).
3. **Relay** — repassa as mensagens de jogo (estado, input, eventos) de um
   jogador pro outro. **Não roda física** — quem simula é o host.

## ▶️ Como rodar

```bash
cd server
npm install
npm start          # porta 8080 (troque com a env PORT)
```

```bash
PORT=9000 npm start   # exemplo em outra porta
```

Sem dependências de build: só Node 18+ e o pacote `ws`.

## 🔌 Conectando o app

O cliente Expo lê a env `EXPO_PUBLIC_PONG_SERVER` (padrão `ws://localhost:8080`):

| Cenário                     | Valor                              |
|-----------------------------|------------------------------------|
| Web / iOS sim no mesmo PC   | `ws://localhost:8080`              |
| Emulador Android            | `ws://10.0.2.2:8080`               |
| Celular físico (Wi-Fi)      | `ws://SEU_IP_LAN:8080`             |

```bash
EXPO_PUBLIC_PONG_SERVER="ws://192.168.0.10:8080" npx expo start
```

## 📨 Protocolo (resumo)

Mensagens são JSON `{ type, ... }`. Cliente → servidor:

- `join_lobby` / `leave_lobby` — entra/sai da fila.
- `input` / `state` / `event` / `rematch` — repassados ao oponente da partida.
- `ping` — responde `pong` (heartbeat).

Servidor → cliente:

- `welcome` `{ you:{id,nick,emoji} }` — identidade ao conectar.
- `lobby` `{ players, count }` — quem está esperando.
- `match_found` `{ matchId, isHost, opponent }` — partida casada.
- `input` / `state` / `event` / `rematch` — relay do oponente.
- `opponent_left` — o outro caiu; o sobrevivente volta pro saguão.

> **Host-autoritativo:** o estado (`state`) viaja sempre no *frame do host*; o
> guest espelha invertendo X e Z. Veja `net/protocol.ts` no cliente.

## 🗂️ Arquivos

```
server/
├── package.json     type:module, dep "ws", script start
├── server.js        WebSocketServer: saguão, matchmaking, relay, heartbeat
└── nicknames.js     makeNickname(taken) → apelido fofo único (emoji + nick)
```

## 📈 Escala / produção

É um servidor de exemplo (estado em memória, 1 processo). Para produção:
rodar atrás de TLS (`wss://`), adicionar reconexão/salas persistentes e mover o
estado de partidas pra fora do processo se for escalar horizontalmente.
