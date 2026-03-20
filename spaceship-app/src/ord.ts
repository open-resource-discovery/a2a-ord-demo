import { Router } from "express";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createOrdRouter(baseUrl: string): Router {
  const router = Router();
  const ordDataDir = join(__dirname, "..", "ord-data");

  // ORD well-known config endpoint
  router.get("/.well-known/open-resource-discovery", (_req, res) => {
    res.json({
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
    });
  });

  // ORD document endpoint
  router.get("/ord/v1/documents/:docId", (req, res) => {
    try {
      const filePath = join(
        ordDataDir,
        "documents",
        `${req.params.docId}.json`,
      );
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      content.describedSystemInstance = { baseUrl };
      res.json(content);
    } catch {
      res.status(404).json({ error: "Document not found" });
    }
  });

  return router;
}
