import React, { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/services/api";

interface Tenant {
  name: string;
  city: string;
  primary_color: string;
  secondary_color: string;
}

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    api
      .get("/fair-config", { params: { city: "Sao Ludgero" } })
      .then((response) => setTenant(response.data))
      .catch(() => setTenant(null));
  }, []);

  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
