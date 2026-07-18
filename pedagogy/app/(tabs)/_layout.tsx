import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

import { Theme } from "@/constants/theme";

// Tab bar alinhada à identidade do app: fundo creme e tint no rosa da marca.
// O azul-claro anterior (#6EC6FF sobre #F4FBFF) não existia em nenhuma outra
// tela e tinha contraste fraco contra o fundo.
export default function Layout() {
  const { t } = useTranslation();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor={Theme.colors.bg}
      tintColor={Theme.colors.primary}
    >
      <NativeTabs.Trigger name="index">
        <Icon
          selectedColor={Theme.colors.primary}
          sf={{
            default: "house",
            selected: "house.fill",
          }}
        />

        <Label>{t("tabs.home")}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <Icon
          selectedColor={Theme.colors.primary}
          sf={{
            default: "book",
            selected: "book.fill",
          }}
        />

        <Label>{t("tabs.library")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
