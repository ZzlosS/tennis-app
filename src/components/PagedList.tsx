import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View, type ViewStyle } from "react-native";

import { useErrorMessage } from "@/errors";
import { useTheme } from "@/theme";
import { EmptyState, ErrorState, LoadingState } from "@/ui";

type Paged<T> = {
  items: T[];
  isLoading: boolean;
  error: unknown;
  refetch: () => unknown;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
};

type Props<T> = {
  list: Paged<T>;
  renderItem: (item: T) => ReactElement;
  keyOf: (item: T) => string;
  emptyTitle: string;
  emptyMessage?: string;
  header?: ReactElement;
  contentStyle?: ViewStyle;
};

/** A list over a paged endpoint: loading, error with retry, empty, pull to refresh and endless scroll. */
export function PagedList<T>({
  list,
  renderItem,
  keyOf,
  emptyTitle,
  emptyMessage,
  header,
  contentStyle,
}: Props<T>) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { colors, spacing } = useTheme();

  const empty = list.isLoading ? (
    <LoadingState label={t("common.loading")} />
  ) : list.error ? (
    <ErrorState
      title={t("common.somethingWrong")}
      message={errorMessage(list.error)}
      retryLabel={t("common.retry")}
      onRetry={() => void list.refetch()}
    />
  ) : (
    <EmptyState title={emptyTitle} message={emptyMessage} />
  );

  return (
    <FlatList
      data={list.items}
      keyExtractor={keyOf}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        list.isFetchingNextPage ? (
          <View style={{ padding: spacing.lg }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching}
          onRefresh={() => void list.refetch()}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={[{ padding: spacing.xl, gap: spacing.md, flexGrow: 1 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
    />
  );
}
