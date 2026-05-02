import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { HomeScreen } from "@/screens/consumer/HomeScreen";
import { ProfileScreen } from "@/screens/producer/ProfileScreen";

const Tab = createBottomTabNavigator();

export function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Início" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}
