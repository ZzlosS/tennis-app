import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/theme";
import { Button } from "./Button";
import { Text } from "./Text";

function Centered({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        padding: spacing.xl,
      }}
    >
      {children}
    </View>
  );
}

export function LoadingState({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Centered>
      <ActivityIndicator color={colors.primary} accessibilityLabel={label} />
    </Centered>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Centered>
      <Text variant="h2" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
    </Centered>
  );
}

type ErrorStateProps = { title: string; message?: string; retryLabel?: string; onRetry?: () => void };

export function ErrorState({ title, message, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <Centered>
      <Text variant="h2" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
      {onRetry && retryLabel ? <Button title={retryLabel} variant="secondary" onPress={onRetry} /> : null}
    </Centered>
  );
}
