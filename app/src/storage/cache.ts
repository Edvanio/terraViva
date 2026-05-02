import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

const TTL_MS = 30 * 60 * 1000;

export async function setCache<T>(key: string, value: T): Promise<void> {
  const payload: CacheItem<T> = {
    value,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as CacheItem<T>;
  if (Date.now() - parsed.timestamp > TTL_MS) {
    await AsyncStorage.removeItem(key);
    return null;
  }
  return parsed.value;
}
