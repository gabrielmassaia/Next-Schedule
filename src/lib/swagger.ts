import { createSwaggerSpec } from "next-swagger-doc";

export const getPublicApiDocs = async () => {
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

export const getInternalApiDocs = async () => {
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
