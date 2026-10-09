// The phone token store, backed by a plain Map so tests can seed and inspect it.
export const secureStore = new Map<string, string>();

export const getItemAsync = async (key: string) => secureStore.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => void secureStore.set(key, value);
export const deleteItemAsync = async (key: string) => void secureStore.delete(key);
