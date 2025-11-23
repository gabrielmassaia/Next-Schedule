import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // define api folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next Schedule API",
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
