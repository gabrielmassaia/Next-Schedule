const fs = require("fs/promises");
const path = require("path");
const { createSwaggerSpec } = require("next-swagger-doc");

const PUBLIC_SPEC_PATH = path.join(process.cwd(), "public", "swagger-public.json");
const INTERNAL_SPEC_PATH = path.join(process.cwd(), "public", "swagger-internal.json");

function buildPublicSpec() {
  return createSwaggerSpec({
    apiFolder: "src/app/api/integrations",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next Schedule API - Integração N8N",
        description:
          "API pública para integrações externas (ex: N8N, Zapier) utilizando API Key.",
        version: "1.0",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key",
          },
        },
      },
      security: [],
    },
  });
}

function buildInternalSpec() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next Schedule Internal API",
        description:
          "Rotas internas do sistema autenticadas via token de sessão (Better Auth).",
        version: "1.0",
      },
      components: {
        securitySchemes: {
          CookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "session",
          },
        },
      },
      security: [{ CookieAuth: [] }],
    },
  });
}

async function writeSpec(filePath, spec) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(spec, null, 2));
}

async function main() {
  const [publicSpec, internalSpec] = [buildPublicSpec(), buildInternalSpec()];

  await Promise.all([
    writeSpec(PUBLIC_SPEC_PATH, publicSpec),
    writeSpec(INTERNAL_SPEC_PATH, internalSpec),
  ]);

  console.log("Swagger specs generated at:");
  console.log(`- ${PUBLIC_SPEC_PATH}`);
  console.log(`- ${INTERNAL_SPEC_PATH}`);
}

main().catch((error) => {
  console.error("Failed to generate Swagger specs:", error);
  process.exit(1);
});
