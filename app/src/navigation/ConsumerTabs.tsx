import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { HomeScreen } from "@/screens/consumer/HomeScreen";
import { BancasScreen } from "@/screens/consumer/BancasScreen";
import { OrdersScreen } from "@/screens/consumer/OrdersScreen";
import { DashboardScreen } from "@/screens/producer/DashboardScreen";
import { ProfileScreen } from "@/screens/producer/ProfileScreen";
import { tokens } from "@/theme/tokens";

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{icon}</Text>;
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: tokens.colors.surface },
        headerTintColor: tokens.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Início",
          tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "🏡" : "🏠"} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Bancas"
        component={BancasScreen}
        options={{
          title: "Produtores",
          tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "🌿" : "🌱"} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: "Pedidos",
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Minha Banca",
          tabBarIcon: ({ focused }) => <TabIcon icon="🌽" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
