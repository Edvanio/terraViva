import * as SecureStore from "expo-secure-store";

import { api } from "./api";

export async function requestOtp(phone: string) {
  const response = await api.post("/auth/request-otp", { phone });
  return response.data;
}

export async function verifyOtp(phone: string, code: string) {
  const response = await api.post("/auth/verify-otp", { phone, code });
  const token = response.data.access_token as string;
  await SecureStore.setItemAsync("token", token);
  return token;
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
}

export async function getStoredToken() {
  return SecureStore.getItemAsync("token");
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}
