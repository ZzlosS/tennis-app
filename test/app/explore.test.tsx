import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { Alert } from "react-native";

import i18n from "@/i18n";
import { court, page, place } from "../fixtures";
import { mockLocation } from "../locationMock";
import { API, server } from "../msw";
import { openSignedIn } from "./signedIn";

function placesApi() {
  const calls: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/places`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      calls.push(params);
      const kind = params.get("kind");
      const all = [
        place(),
        place({ id: "park1", kind: "PUBLIC", name: "Ušće park", courtCount: 1, distanceKm: 0.4 }),
      ];
      return HttpResponse.json(page(all.filter((p) => !kind || p.kind === kind)));
    }),
  );
  return calls;
}

beforeEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

test("the list shows nearby places and the chips filter them by kind", async () => {
  const calls = placesApi();
  await openSignedIn("/explore");
  expect(await screen.findByText("TK Banjica")).toBeOnTheScreen();
  expect(screen.getByText("Ušće park")).toBeOnTheScreen();
  expect(screen.getByText("400 m")).toBeOnTheScreen();
  expect(calls[0]!.get("lat")).toBe("44.8");

  fireEvent.press(screen.getAllByText("Public")[0]!);
  expect(await screen.findByText("Ušće park")).toBeOnTheScreen();
  expect(screen.queryByText("TK Banjica")).toBeNull();
  expect(calls.at(-1)!.get("kind")).toBe("PUBLIC");
});

test("a refused location falls back to Belgrade and still lists places", async () => {
  mockLocation.status = "denied";
  const calls = placesApi();
  await openSignedIn("/explore");
  expect(await screen.findByText("TK Banjica")).toBeOnTheScreen();
  expect(screen.getByText(/Location is off/)).toBeOnTheScreen();
  expect(calls[0]!.get("lat")).toBe("44.8125");
});

test("the map widens to 25 km when nothing is within 5 km, and a pin opens its card", async () => {
  const radii: string[] = [];
  server.use(
    http.get(`${API}/places`, ({ request }) => {
      const radius = new URL(request.url).searchParams.get("radiusKm")!;
      radii.push(radius);
      return HttpResponse.json(
        page(radius === "5" ? [] : [place(), place({ id: "park1", kind: "PUBLIC", name: "Ušće park" })]),
      );
    }),
  );
  await openSignedIn("/explore?view=map");
  fireEvent.press(await screen.findByLabelText("pin Ušće park"));
  expect(await screen.findByText("View court")).toBeOnTheScreen();
  expect(screen.getByText("· within 25 km")).toBeOnTheScreen();
  expect(radii).toEqual(["5", "25"]);
});

test("a free court shows Free, and only its owner sees Edit", async () => {
  server.use(
    http.get(`${API}/courts/park1`, () =>
      HttpResponse.json(
        court({ id: "park1", kind: "PUBLIC", club: null, ownerId: "p1", pricePerHour: null }),
      ),
    ),
  );
  const { view } = await openSignedIn("/courts/park1");
  expect(await screen.findByText("Free")).toBeOnTheScreen();
  expect(screen.getByText("Edit")).toBeOnTheScreen();
  expect(screen.getByText("Give to a club")).toBeOnTheScreen();
  view.unmount();

  await openSignedIn("/courts/park1", { id: "someone-else" });
  expect(await screen.findByText("Free")).toBeOnTheScreen();
  expect(screen.queryByText("Edit")).toBeNull();
});

test("an owner deletes their court after confirming", async () => {
  let deleted = false;
  server.use(
    http.get(`${API}/courts/park1`, () =>
      HttpResponse.json(court({ id: "park1", kind: "PUBLIC", club: null, ownerId: "p1" })),
    ),
    http.delete(`${API}/courts/park1`, () => {
      deleted = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => buttons?.[1]?.onPress?.());
  await openSignedIn("/courts/park1");
  fireEvent.press(await screen.findByText("Delete"));
  await waitFor(() => expect(deleted).toBe(true));
});

test("the add form shows the API's field errors, in English and Serbian", async () => {
  let sent: Record<string, unknown> | undefined;
  server.use(
    http.post(`${API}/courts`, async ({ request }) => {
      sent = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "bad", fields: { name: ["too long"] } } },
        { status: 400 },
      );
    }),
  );
  await openSignedIn("/courts/new");
  fireEvent.changeText(await screen.findByLabelText("Name"), "Ušće 1");
  fireEvent.changeText(screen.getByLabelText("Address"), "Ušće bb");
  fireEvent.press(screen.getByText("Add court"));
  expect(await screen.findByText("Some fields need another look.")).toBeOnTheScreen();
  expect(screen.getByText("Check this field.")).toBeOnTheScreen();
  expect(sent).toMatchObject({
    kind: "PUBLIC",
    name: "Ušće 1",
    city: "Beograd",
    surface: "HARD",
    latitude: 44.8,
    longitude: 20.4,
  });
  expect(sent).not.toHaveProperty("pricePerHourMinor");

  await act(() => i18n.changeLanguage("sr"));
  fireEvent.press(screen.getAllByText("Dodaj teren").at(-1)!);
  expect(await screen.findByText("Neka polja treba ispraviti.")).toBeOnTheScreen();
});

test("a price is sent in minor units with its currency", async () => {
  let sent: Record<string, unknown> | undefined;
  server.use(
    http.post(`${API}/courts`, async ({ request }) => {
      sent = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(court({ id: "new1", kind: "PRIVATE", club: null, ownerId: "p1" }), {
        status: 201,
      });
    }),
    http.get(`${API}/courts/new1`, () =>
      HttpResponse.json(court({ id: "new1", kind: "PRIVATE", club: null })),
    ),
  );
  await openSignedIn("/courts/new");
  fireEvent.press(await screen.findByText("Private"));
  fireEvent.changeText(screen.getByLabelText("Name"), "Moj teren");
  fireEvent.changeText(screen.getByLabelText("Address"), "Dedinje 3");
  fireEvent(screen.getByLabelText("Free to play"), "valueChange", false);
  fireEvent.changeText(screen.getByLabelText("Price per hour"), "12,50");
  fireEvent.press(screen.getByText("EUR"));
  fireEvent.press(screen.getByText("Add court"));
  await waitFor(() =>
    expect(sent).toMatchObject({ kind: "PRIVATE", pricePerHourMinor: 1250, currency: "EUR" }),
  );
  expect(await screen.findByText("Court 1")).toBeOnTheScreen();
});
