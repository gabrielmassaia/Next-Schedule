# Swagger Integration Walkthrough

I have successfully integrated Swagger/OpenAPI documentation into your Next.js project using `next-swagger-doc` and `swagger-ui-react`.

## Accessing the Documentation

You can now access the interactive API documentation at:
**[http://localhost:3000/api-doc](http://localhost:3000/api-doc)**

## Implementation Details

1.  **Dependencies**: Installed `next-swagger-doc` and `swagger-ui-react`.
2.  **Configuration**: Created `src/lib/swagger.ts` to configure the OpenAPI spec generator.
3.  **UI Page**: Created `src/app/api-doc/page.tsx` to render the Swagger UI.
4.  **Annotations**: Added JSDoc comments (YAML format) to all integration API routes in `src/app/api/integrations`.

## How to Add New Endpoints

To document a new API route, simply add a JSDoc comment above the exported function (GET, POST, etc.) in your `route.ts` file.

**Example:**

```typescript
/**
 * @swagger
 * /api/my-new-route:
 *   get:
 *     description: Returns a hello world message
 *     responses:
 *       200:
 *         description: Hello World!
 */
export async function GET(request: Request) {
  // ...
}
```

The scanner configured in `src/lib/swagger.ts` will automatically pick up these comments and update the documentation page.
