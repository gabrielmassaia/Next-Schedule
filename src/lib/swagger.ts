import fs from "fs/promises";
import { createSwaggerSpec } from "next-swagger-doc";
import path from "path";

type SwaggerOptions = {
  /**
   * Se verdadeiro, tenta carregar um JSON pré-gerado em `public/`. Isso evita que a
   * varredura precise acessar os arquivos de rota (que não existem na build final da Vercel).
   */
  usePrebuiltSpec?: boolean;
};

const PUBLIC_SPEC_PATH = path.join(
  process.cwd(),
  "public",
  "swagger-public.json",
);
const INTERNAL_SPEC_PATH = path.join(
  process.cwd(),
  "public",
  "swagger-internal.json",
);

const readSpecFromDisk = async (filePath: string) => {
  try {
    const file = await fs.readFile(filePath, "utf-8");
    return JSON.parse(file);
  } catch {
    return null;
  }
};

export const getPublicApiDocs = async (options: SwaggerOptions = {}) => {
  const usePrebuiltSpec = options.usePrebuiltSpec ?? true;

  if (usePrebuiltSpec) {
    const prebuilt = await readSpecFromDisk(PUBLIC_SPEC_PATH);
    if (prebuilt) {
      console.log("Using prebuilt public swagger spec");
      return prebuilt;
    }
  }

  const spec = createSwaggerSpec({
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
  return spec;
};

export const getInternalApiDocs = async (options: SwaggerOptions = {}) => {
  const usePrebuiltSpec = options.usePrebuiltSpec ?? true;

  if (usePrebuiltSpec) {
    const prebuilt = await readSpecFromDisk(INTERNAL_SPEC_PATH);
    if (prebuilt) {
      console.log("Using prebuilt internal swagger spec");
      return prebuilt;
    }
  }

  const spec = createSwaggerSpec({
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
            name: "session", // Adjust based on your auth cookie name
          },
        },
      },
      security: [{ CookieAuth: [] }],
    },
  });
  return spec;
};
