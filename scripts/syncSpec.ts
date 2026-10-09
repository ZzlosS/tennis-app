// Copies the backend's OpenAPI spec into api/openapi.json and records where it came from.
//
//   npm run api:sync -- --from ../tennis            (a local checkout of ZzlosS/tennis)
//   npm run api:sync -- --ref <commit or branch>    (downloads from GitHub; set GITHUB_TOKEN for a private repo)
//
// Then run `npm run api:generate` and commit both.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = "ZzlosS/tennis";
const SPEC_PATH = "openapi/v1.json";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const from = arg("from");
  const ref = arg("ref");
  let spec: string;
  let version: string;

  if (from) {
    const dir = resolve(from);
    spec = readFileSync(join(dir, SPEC_PATH), "utf8");
    version = execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } else if (ref) {
    const headers: Record<string, string> = { Accept: "application/vnd.github.raw+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${SPEC_PATH}?ref=${encodeURIComponent(ref)}`,
      {
        headers,
      },
    );
    if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${REPO}@${ref}`);
    spec = await res.text();
    version = ref;
  } else {
    throw new Error("Pass --from <path to a tennis checkout> or --ref <commit>.");
  }

  JSON.parse(spec); // fail before writing anything that is not JSON
  writeFileSync("api/openapi.json", spec.endsWith("\n") ? spec : `${spec}\n`);
  writeFileSync("api/SPEC_VERSION", `${version}\n`);
  console.log(`api/openapi.json now matches ${REPO}@${version}. Run npm run api:generate next.`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
