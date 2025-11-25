import fs from "fs/promises";
import path from "path";

import { getInternalApiDocs, getPublicApiDocs } from "../src/lib/swagger";

async function generateSwaggerDocs() {
  try {
    console.log("Generating Swagger documentation...");

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), "public");
    await fs.mkdir(publicDir, { recursive: true });

    // Generate Public API Docs
    const publicSpec = await getPublicApiDocs({ usePrebuiltSpec: false });
    await fs.writeFile(
      path.join(publicDir, "swagger-public.json"),
      JSON.stringify(publicSpec, null, 2),
    );
    console.log("✅ Generated public/swagger-public.json");

    // Generate Internal API Docs
    const internalSpec = await getInternalApiDocs({ usePrebuiltSpec: false });
    await fs.writeFile(
      path.join(publicDir, "swagger-internal.json"),
      JSON.stringify(internalSpec, null, 2),
    );
    console.log("✅ Generated public/swagger-internal.json");
  } catch (error) {
    console.error("❌ Failed to generate Swagger documentation:", error);
    process.exit(1);
  }
}

generateSwaggerDocs();
