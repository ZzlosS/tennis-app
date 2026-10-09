import { formatDate, formatMoney, formatSlot, formatTime, minorUnits } from "@/format";
import { intlLocale } from "@/i18n";

const en = intlLocale("en");
const sr = intlLocale("sr");

describe("money", () => {
  test("RSD and EUR use two minor digits and drop .00", () => {
    expect(minorUnits("RSD")).toBe(2);
    expect(formatMoney({ amountMinor: 180000, currency: "RSD" }, en)).toMatch(/^RSD\s?1,800$/);
    expect(formatMoney({ amountMinor: 180000, currency: "RSD" }, sr)).toMatch(/^1\.800\sRSD$/);
    expect(formatMoney({ amountMinor: 2550, currency: "EUR" }, en)).toMatch(/^EUR\s?25\.50$/);
  });

  test("no price means free", () => {
    expect(formatMoney(null, en)).toBeNull();
    expect(formatMoney(undefined, sr)).toBeNull();
  });

  test("zero-decimal currencies are not divided", () => {
    expect(formatMoney({ amountMinor: 1500, currency: "JPY" }, en)).toMatch(/^JPY\s?1,500$/);
  });
});

describe("dates in the club's time zone", () => {
  // 22:30 UTC on 9 Oct is 00:30 on 10 Oct in Belgrade (summer time).
  const lateUtc = "2026-10-09T22:30:00.000Z";

  test("a booking just before UTC midnight shows the Belgrade date and time", () => {
    expect(formatTime(lateUtc, en)).toBe("00:30");
    expect(formatDate(lateUtc, en)).toBe("Sat 10 Oct");
  });

  test("Serbian uses Latin script", () => {
    expect(formatDate(lateUtc, sr)).toMatch(/^sub/i);
    expect(formatDate(lateUtc, sr)).not.toMatch(/[Ѐ-ӿ]/);
  });

  test("another club time zone moves the hour", () => {
    expect(formatTime(lateUtc, en, "Europe/London")).toBe("23:30");
  });

  test("a slot reads as a date and a range", () => {
    expect(formatSlot("2026-10-10T16:00:00Z", "2026-10-10T17:00:00Z", en)).toBe("Sat 10 Oct, 18:00–19:00");
  });
});
