import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function Layout() {
  return (
    <NativeTabs
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

        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="library">
        <Icon
          selectedColor="#6EC6FF"
          sf={{
            default: "book",
            selected: "book.fill",
          }}
        />

        <Label>Library</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
