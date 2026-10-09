import AsyncStorage from "@react-native-async-storage/async-storage";

// Small choices the app remembers between launches: the look, light or dark, the last map area.
// Storage can fail (private browsing, a full disk); a setting that cannot be read is simply not set.
const PREFIX = "rally.setting.";

export async function readSetting<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export async function writeSetting<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Not worth interrupting the player over; the choice still applies until the app closes.
  }
}
