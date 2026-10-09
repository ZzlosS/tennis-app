import spec from "../../api/openapi.json";
import { allErrorCodes } from "@/api";
import { resources } from "@/i18n";

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  );
}

const languages = Object.keys(resources) as (keyof typeof resources)[];
const english = keys(resources.en.translation as Tree).sort();

test.each(languages)("%s has exactly the same keys as English", (language) => {
  expect(keys(resources[language].translation as Tree).sort()).toEqual(english);
});

test.each(languages)("%s has no empty strings", (language) => {
  const flat = keys(resources[language].translation as Tree);
  const tree = resources[language].translation as Tree;
  for (const key of flat) {
    const value = key.split(".").reduce<Tree | string>((node, part) => (node as Tree)[part]!, tree);
    expect(String(value).trim()).not.toBe("");
  }
});

const specCodes: string[] = (spec as { components: { schemas: { ErrorCode: { enum: string[] } } } })
  .components.schemas.ErrorCode.enum;

test("the app knows every error code in the API spec", () => {
  expect(allErrorCodes).toEqual(expect.arrayContaining(specCodes));
});

test.each(languages)("%s translates every error code", (language) => {
  const errors = (resources[language].translation as Tree).errors as Tree;
  for (const code of allErrorCodes) expect(errors[code]).toEqual(expect.any(String));
});
