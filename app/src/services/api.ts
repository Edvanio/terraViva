import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
