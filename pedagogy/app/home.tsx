import { Redirect } from "expo-router";

/**
 * Deep-link canônico do app: `pedagogy://home`.
 *
 * No expo-router, grupos entre parênteses (como `(tabs)`) não fazem parte do
 * path das URLs — servem só pra organização. Isso significa que a home real
 * (`app/(tabs)/index.tsx`) responde em `pedagogy://` e não em
 * `pedagogy://home`. Sem esta rota, o link cai em rota inexistente e o app
 * abre em branco — foi exatamente o bug ao clicar no in-app event do App
 * Store Connect.
 *
 * Este arquivo é um redirect declarativo. Se um dia a home mudar de lugar
 * (ex.: virar `(main)/index`), basta ajustar o `href` aqui e o link do
 * evento continua funcionando sem republicar metadata na App Store.
 */
export default function HomeDeepLink() {
  return <Redirect href="/(tabs)" />;
}
