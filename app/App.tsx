import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { RootNavigator } from "@/navigation/RootNavigator";
import { startSyncListener } from "@/services/sync";

function AppInner() {
  useEffect(() => {
    const unsubscribe = startSyncListener();
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppInner />
      </TenantProvider>
    </AuthProvider>
  );
}
