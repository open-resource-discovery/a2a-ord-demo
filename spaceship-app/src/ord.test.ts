import { describe, it, snapshot } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Store snapshots in src/ (not dist/) so they can be committed
snapshot.setResolveSnapshotPath((testPath: string | undefined) => {
  return (testPath ?? "").replace(/dist[/\\]/, "src/") + ".snapshot";
});

const documentSchema = JSON.parse(
  readFileSync(
    require.resolve("@open-resource-discovery/specification/dist/generated/spec/v1/schemas/Document.schema.json"),
    "utf-8",
  ),
);

const configSchema = JSON.parse(
  readFileSync(
    require.resolve("@open-resource-discovery/specification/dist/generated/spec/v1/schemas/Configuration.schema.json"),
    "utf-8",
  ),
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv = require("ajv").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const addFormats = require("ajv-formats");

function formatErrors(
  errors: Array<{ instancePath?: string; message?: string }>,
): string {
  return errors
    .map((e) => `  ${e.instancePath || "/"}: ${e.message}`)
    .join("\n");
}

describe("ORD Schema Validation", () => {
  const docPath = join(
    __dirname,
    "..",
    "ord-data",
    "documents",
    "document.json",
  );

  it("ORD document validates against official Document.schema.json", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(documentSchema);
    const doc = JSON.parse(readFileSync(docPath, "utf-8"));
    const valid = validate(doc);
    if (!valid) {
      assert.fail(
        `ORD document schema validation failed:\n${formatErrors(validate.errors!)}`,
      );
    }
  });

  it("ORD document matches snapshot", (t) => {
    const doc = JSON.parse(readFileSync(docPath, "utf-8"));
    t.assert.snapshot(doc);
  });

  it("ORD configuration response validates against Configuration.schema.json", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(configSchema);
    const config = {
      $schema:
        "https://open-resource-discovery.org/spec-v1/interfaces/Configuration.schema.json",
      openResourceDiscoveryV1: {
        documents: [
          {
            url: "/ord/v1/documents/document",
            accessStrategies: [{ type: "open" }],
          },
        ],
      },
    };
    const valid = validate(config);
    if (!valid) {
      assert.fail(
        `ORD configuration schema validation failed:\n${formatErrors(validate.errors!)}`,
      );
    }
  });
});
