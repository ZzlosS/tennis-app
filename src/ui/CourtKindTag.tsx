import { useTranslation } from "react-i18next";

import { Tag, type CourtKind } from "./Tag";

export function CourtKindTag({ kind }: { kind: CourtKind }) {
  const { t } = useTranslation();
  return <Tag kind={kind} label={t(`courtKind.${kind}`)} />;
}
