import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const { t } = useTranslation();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      backgroundColor="#F4FBFF"
      tintColor="#6EC6FF" // azul claro ativo
    >
      <NativeTabs.Trigger name="index">
        <Icon
          selectedColor="#6EC6FF"
          sf={{
            default: "house",
            selected: "house.fill",
          }}
        />

        <Label>{t("tabs.home")}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <Icon
          selectedColor="#6EC6FF"
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
