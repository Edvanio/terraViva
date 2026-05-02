import NetInfo from "@react-native-community/netinfo";

import { api } from "./api";
import { clearQueue, getQueue } from "@/storage/queue";

export function startSyncListener() {
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    if (!state.isConnected) {
      return;
    }

    const queue = await getQueue();
    for (const item of queue) {
      if (item.method === "POST") {
        await api.post(item.path, item.body);
      } else {
        await api.put(item.path, item.body);
      }
    }

    if (queue.length > 0) {
      await clearQueue();
    }
  });

  return unsubscribe;
}
