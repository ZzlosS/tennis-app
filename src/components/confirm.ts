import { Alert, Platform } from "react-native";

type Options = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
};

/** Asks a yes/no question and resolves true when the player confirms. Uses the browser dialog on web. */
export function confirm({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
}: Options): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(globalThis.confirm?.(message ? `${title}\n\n${message}` : title) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

type Choice<T extends string> = { value: T; label: string; destructive?: boolean };

/** Asks which of a few actions to take; resolves null when the player backs out. */
export function choose<T extends string>(
  title: string,
  choices: Choice<T>[],
  cancelLabel: string,
  message?: string,
): Promise<T | null> {
  if (Platform.OS === "web") {
    // The browser has no multi-button dialog: ask about each choice in turn.
    for (const choice of choices) {
      if (globalThis.confirm?.(`${title}\n\n${choice.label}?`)) return Promise.resolve(choice.value);
    }
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        ...choices.map((choice) => ({
          text: choice.label,
          style: choice.destructive ? ("destructive" as const) : ("default" as const),
          onPress: () => resolve(choice.value),
        })),
        { text: cancelLabel, style: "cancel" as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
