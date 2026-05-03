import { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/context/AuthContext";
import { Onboarding } from "@/components/Onboarding";
import { AppTabs } from "@/navigation/ConsumerTabs";
import { PhoneScreen } from "@/screens/auth/PhoneScreen";
import { OtpScreen } from "@/screens/auth/OtpScreen";
import { BancaScreen } from "@/screens/consumer/BancaScreen";
import { CheckoutScreen } from "@/screens/consumer/CheckoutScreen";
import { ProductsScreen } from "@/screens/producer/ProductsScreen";
import { AddProductScreen } from "@/screens/producer/AddProductScreen";
import { AIProductScreen } from "@/screens/producer/AIProductScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { token, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((v) => setOnboardingDone(v === "1"));
  }, []);

  if (loading || onboardingDone === null) {
    return null;
  }

  if (!onboardingDone) {
    return <Onboarding onDone={() => setOnboardingDone(true)} />;
  }

  return (
    <Stack.Navigator>
      {!token ? (
        <>
          <Stack.Screen name="Phone" component={PhoneScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Otp" component={OtpScreen} options={{ title: "Codigo" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Banca" component={BancaScreen} options={{ title: "Banca" }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Reserva" }} />
          <Stack.Screen name="MyProducts" component={ProductsScreen} options={{ title: "Meus Produtos" }} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "Novo Produto" }} />
          <Stack.Screen name="AIProduct" component={AIProductScreen} options={{ title: "Cadastro inteligente" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
