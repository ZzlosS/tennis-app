import { resolveApiUrl } from "@/config";

describe("resolveApiUrl", () => {
  it("keeps a fixed URL and drops trailing slashes", () => {
    expect(resolveApiUrl("http://10.0.2.2:8787/v1/", "192.168.1.23")).toBe("http://10.0.2.2:8787/v1");
  });

  it("uses the dev server's host on port 8787 for auto", () => {
    expect(resolveApiUrl("auto", "192.168.1.23")).toBe("http://192.168.1.23:8787/v1");
    expect(resolveApiUrl(" AUTO ", "localhost")).toBe("http://localhost:8787/v1");
  });

  it("wraps an IPv6 host in brackets", () => {
    expect(resolveApiUrl("auto", "fe80::1")).toBe("http://[fe80::1]:8787/v1");
  });

  it("gives an empty URL for auto when the host is unknown", () => {
    expect(resolveApiUrl("auto", undefined)).toBe("");
  });

  it("gives an empty URL when nothing is set", () => {
    expect(resolveApiUrl("", "192.168.1.23")).toBe("");
  });
});
