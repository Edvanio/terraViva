import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QueueItem {
  id: string;
  path: string;
  method: "POST" | "PUT";
  body: unknown;
}

const QUEUE_KEY = "offline_queue";

export async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as QueueItem[];
}

export async function enqueue(item: QueueItem): Promise<void> {
  const items = await getQueue();
  items.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
