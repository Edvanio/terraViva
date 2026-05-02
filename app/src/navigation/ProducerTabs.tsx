import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { DashboardScreen } from "@/screens/producer/DashboardScreen";
import { ProductsScreen } from "@/screens/producer/ProductsScreen";
import { ProfileScreen } from "@/screens/producer/ProfileScreen";

const Tab = createBottomTabNavigator();

export function ProducerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
