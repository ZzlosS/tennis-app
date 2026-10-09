import type {
  BookingResponse,
  ClubDetailResponse,
  ClubResponse,
  CourtResponse,
  HandoverResponse,
  MatchResponse,
  MeResponse,
  NotificationResponse,
  OpeningHours,
  PartnerRequestResponse,
  PlaceResponse,
  PlayerSummary,
} from "@/api";

// Small builders for API answers, so screen tests only spell out what they check.

const week: OpeningHours = Array.from({ length: 7 }, () => ({ open: "08:00", close: "22:00" }));

export const me = (over: Partial<MeResponse> = {}): MeResponse => ({
  id: "p1",
  firstName: "Ana",
  lastName: "Ivanović",
  nickname: "ana",
  email: "ana@example.rs",
  level: "ADVANCED",
  role: "PLAYER",
  address: "Knez Mihailova 1",
  city: "Beograd",
  country: "Srbija",
  emailVerified: true,
  language: "en",
  ...over,
});

export const playerSummary = (over: Partial<PlayerSummary> = {}): PlayerSummary => ({
  id: "p2",
  nickname: "marko",
  level: "INTERMEDIATE",
  ...over,
});

export const club = (over: Partial<ClubResponse> = {}): ClubResponse => ({
  id: "club1",
  name: "TK Banjica",
  address: "Pere Velimirovića 2",
  description: "Six clay courts.",
  city: "Beograd",
  country: "Srbija",
  currency: "RSD",
  courtCount: 1,
  timeZone: "Europe/Belgrade",
  openingHours: week,
  cancelCutoffHours: 24,
  seasonEndsOn: null,
  latitude: 44.77,
  longitude: 20.45,
  ...over,
});

export const court = (over: Partial<CourtResponse> = {}): CourtResponse => ({
  id: "court1",
  name: "Court 1",
  surface: "CLAY",
  stands: false,
  roof: false,
  double: true,
  kind: "CLUB",
  club: { id: "club1", name: "TK Banjica", city: "Beograd" },
  ownerId: null,
  address: "Pere Velimirovića 2",
  city: "Beograd",
  country: "Srbija",
  pricePerHour: { amountMinor: 180000, currency: "RSD" },
  active: true,
  timeZone: "Europe/Belgrade",
  openingHours: week,
  latitude: 44.77,
  longitude: 20.45,
  ...over,
});

export const clubDetail = (over: Partial<ClubDetailResponse> = {}): ClubDetailResponse => ({
  ...club(),
  courts: [court()],
  ...over,
});

export const place = (over: Partial<PlaceResponse> = {}): PlaceResponse => ({
  id: "club1",
  kind: "CLUB",
  name: "TK Banjica",
  address: "Pere Velimirovića 2",
  city: "Beograd",
  latitude: 44.77,
  longitude: 20.45,
  distanceKm: 1.2,
  courtCount: 6,
  ...over,
});

export const booking = (over: Partial<BookingResponse> = {}): BookingResponse => ({
  id: "b1",
  startsAt: "2026-11-02T17:00:00Z",
  endsAt: "2026-11-02T18:00:00Z",
  court: { id: "court1", name: "Court 1", surface: "CLAY", clubId: "club1" },
  club: { id: "club1", name: "TK Banjica", city: "Beograd" },
  player: { id: "p1", nickname: "ana", level: "ADVANCED" },
  totalPrice: { amountMinor: 180000, currency: "RSD" },
  bookingType: "ONE_TIME",
  status: "CONFIRMED",
  seriesId: null,
  paidAt: null,
  partnerRequest: null,
  ...over,
});

export const partnerRequest = (over: Partial<PartnerRequestResponse> = {}): PartnerRequestResponse => ({
  id: "r1",
  booking: {
    id: "b9",
    startsAt: "2026-11-07T09:00:00Z",
    endsAt: "2026-11-07T10:00:00Z",
    court: { id: "court1", name: "Court 1", surface: "HARD", clubId: "club1" },
    club: { id: "club1", name: "TK Banjica", city: "Beograd" },
  },
  createdBy: playerSummary(),
  playersNeeded: 1,
  level: "ADVANCED",
  spotsLeft: 1,
  joined: [],
  status: "OPEN",
  ...over,
});

export const match = (over: Partial<MatchResponse> = {}): MatchResponse => ({
  id: "m1",
  firstTeam: [{ id: "p1", nickname: "ana", level: "ADVANCED" }],
  secondTeam: [playerSummary()],
  sets: [
    { firstTeam: 6, secondTeam: 4 },
    { firstTeam: 6, secondTeam: 3 },
  ],
  status: "CONFIRMED",
  createdBy: { id: "p1", nickname: "ana", level: "ADVANCED" },
  playedAt: "2026-10-01T10:00:00Z",
  court: { id: "court1", name: "Court 1", surface: "CLAY", clubId: "club1" },
  club: { id: "club1", name: "TK Banjica", city: "Beograd" },
  ...over,
});

export const handover = (over: Partial<HandoverResponse> = {}): HandoverResponse => ({
  id: "h1",
  court: { id: "park1", name: "Kalemegdan court", surface: "HARD", clubId: null },
  club: { id: "club1", name: "TK Banjica", city: "Beograd" },
  requestedBy: playerSummary(),
  status: "PENDING",
  createdAt: "2026-10-08T10:00:00Z",
  decidedAt: null,
  ...over,
});

export const notification = (over: Partial<NotificationResponse> = {}): NotificationResponse => ({
  id: "n1",
  type: "BOOKING_CANCELLED",
  title: "Booking cancelled",
  body: "Your booking at Court 1 was cancelled.",
  data: { type: "BOOKING_CANCELLED", bookingId: "b1" },
  createdAt: "2026-10-09T08:00:00Z",
  read: false,
  ...over,
});

/** One page of a list endpoint. */
export const page = <T>(items: T[], nextCursor: string | null = null) => ({ items, nextCursor });
