import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import {
  getGetMeQueryKey,
  getGetMyClubsQueryKey,
  useDeleteCourt,
  useGetMyClubs,
  useGetMyCourts,
  useInvalidate,
  useResendVerification,
  useUpdateMe,
  type CourtResponse,
} from "@/api";
import { useAuth } from "@/auth";
import { Choice } from "@/components/Choice";
import { confirm } from "@/components/confirm";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Notice } from "@/components/Notice";
import { useErrorMessage } from "@/errors";
import { isLanguage } from "@/i18n";
import { useTheme, useThemeSettings, type SchemePreference, type ThemeName } from "@/theme";
import {
  Avatar,
  Button,
  Card,
  CourtKindTag,
  Divider,
  ErrorState,
  LoadingState,
  Price,
  Screen,
  SurfaceTile,
  Text,
  type IconName,
} from "@/ui";

function Section({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text variant="h2" style={{ flex: 1 }}>
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text variant="label" tone="primary">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A row that opens another screen: Manage club, Match history, Rackets. */
function LinkRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 48,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function MyCourt({ court }: { court: CourtResponse }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const invalidate = useInvalidate();
  const errorMessage = useErrorMessage();
  const remove = useDeleteCourt();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const yes = await confirm({
      title: t("court.deleteTitle", { name: court.name }),
      message: t("court.deleteMessage"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!yes) return;
    try {
      await remove.mutateAsync({ id: court.id });
      await invalidate("courts");
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const small = { height: 36, paddingHorizontal: 12, flex: 1 } as const;
  return (
    <Card style={{ gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/courts/${court.id}`)}
        style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
      >
        <SurfaceTile surface={court.surface} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{court.name}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <CourtKindTag kind={court.kind} />
            <Price price={court.pricePerHour} perHour />
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button
          variant="secondary"
          title={t("common.edit")}
          style={small}
          onPress={() => router.push(`/courts/${court.id}/edit`)}
        />
        {court.kind !== "CLUB" ? (
          <Button
            variant="secondary"
            title={t("profile.giveToClub")}
            style={small}
            onPress={() => router.push(`/courts/${court.id}/handover`)}
          />
        ) : null}
        <Button variant="ghost" title={t("common.delete")} style={small} onPress={onDelete} />
      </View>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Card>
  );
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { me, meError, refetchMe, signOut, isClubAdmin } = useAuth();
  const errorMessage = useErrorMessage();
  const { spacing } = useTheme();
  const { themeName, setThemeName, schemePreference, setSchemePreference } = useThemeSettings();
  const updateMe = useUpdateMe({
    mutation: { onSuccess: (updated) => queryClient.setQueryData(getGetMeQueryKey(), updated) },
  });
  const resend = useResendVerification();
  const courts = useGetMyCourts({ limit: 50 }, { query: { enabled: me != null } });
  const clubs = useGetMyClubs(
    { limit: 50 },
    { query: { enabled: isClubAdmin, queryKey: getGetMyClubsQueryKey({ limit: 50 }) } },
  );

  if (!me) {
    return meError ? (
      <ErrorState
        title={t("common.somethingWrong")}
        message={errorMessage(meError)}
        retryLabel={t("common.retry")}
        onRetry={refetchMe}
      />
    ) : (
      <LoadingState label={t("common.loading")} />
    );
  }

  const name = `${me.firstName} ${me.lastName}`.trim();
  const myCourts = courts.data?.items ?? [];
  const myClubs = isClubAdmin ? (clubs.data?.items ?? []) : [];

  return (
    <Screen>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Avatar name={name} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="h2">{name}</Text>
          <Text tone="muted">{[`@${me.nickname}`, me.city, t(`level.${me.level}`)].join(" · ")}</Text>
          {me.role !== "PLAYER" ? (
            <Text variant="small" tone="muted">
              {t(`profile.role.${me.role}`)}
            </Text>
          ) : null}
        </View>
      </Card>
      <Button variant="secondary" title={t("profile.edit")} onPress={() => router.push("/profile/edit")} />
      {!me.emailVerified ? (
        <View style={{ gap: spacing.sm }}>
          <Notice>{resend.isSuccess ? t("profile.verificationSent") : t("profile.emailNotVerified")}</Notice>
          {!resend.isSuccess ? (
            <Button
              variant="ghost"
              title={t("profile.sendAgain")}
              loading={resend.isPending}
              onPress={() =>
                resend.mutate({ params: { language: isLanguage(i18n.language) ? i18n.language : "en" } })
              }
            />
          ) : null}
          {resend.isError ? <Notice tone="error">{errorMessage(resend.error)}</Notice> : null}
        </View>
      ) : null}

      <Section
        title={t("profile.myCourts")}
        action={{ label: t("profile.add"), onPress: () => router.push("/courts/new") }}
      />
      {myCourts.length === 0 && courts.isSuccess ? <Text tone="muted">{t("profile.noCourts")}</Text> : null}
      {myCourts.map((court) => (
        <MyCourt key={court.id} court={court} />
      ))}

      <Card style={{ gap: 0 }}>
        {myClubs.map((club) => (
          <LinkRow
            key={club.id}
            icon="business-outline"
            label={t("profile.manageClub", { club: club.name })}
            onPress={() => router.push(`/club-admin/${club.id}/today`)}
          />
        ))}
        <LinkRow
          icon="trophy-outline"
          label={t("profile.matchHistory")}
          onPress={() => router.push("/matches")}
        />
        <LinkRow
          icon="notifications-outline"
          label={t("profile.notifications")}
          onPress={() => router.push("/notifications")}
        />
        <LinkRow
          icon="tennisball-outline"
          label={t("profile.rackets")}
          onPress={() => router.push("/profile/rackets")}
        />
        <LinkRow
          icon="key-outline"
          label={t("profile.changePassword")}
          onPress={() => router.push("/profile/password")}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="muted">
          {t("language.title")}
        </Text>
        {/* Saving the language on the profile makes emails and push notifications match it. */}
        <LanguageSwitch onChange={(language) => updateMe.mutate({ data: { language } })} />
        {updateMe.isError ? <Notice tone="error">{errorMessage(updateMe.error)}</Notice> : null}
      </View>

      <Choice<ThemeName>
        label={t("appearance.look")}
        value={themeName}
        onChange={setThemeName}
        options={[
          { value: "minimal", label: t("appearance.minimal") },
          { value: "wimbledon", label: t("appearance.wimbledon") },
        ]}
      />
      <Choice<SchemePreference>
        label={t("appearance.scheme")}
        value={schemePreference}
        onChange={setSchemePreference}
        options={[
          { value: "system", label: t("appearance.system") },
          { value: "light", label: t("appearance.light") },
          { value: "dark", label: t("appearance.dark") },
        ]}
      />
      <Divider />
      <Button title={t("auth.signOut")} variant="secondary" onPress={signOut} />
      <Button
        title={t("profile.deleteAccount")}
        variant="ghost"
        onPress={() => router.push("/profile/delete-account")}
      />
    </Screen>
  );
}
