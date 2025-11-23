# Swagger Integration Walkthrough

I have successfully integrated Swagger/OpenAPI documentation into your Next.js project using `next-swagger-doc` and `swagger-ui-react`.

## Accessing the Documentation

You can now access the interactive API documentation at:
**[http://localhost:3000/api-doc](http://localhost:3000/api-doc)** (Public/Integrations)
**[http://localhost:3000/api-doc/internal](http://localhost:3000/api-doc/internal)** (Internal API)

## Implementation Details

1.  **Dependencies**: Installed `next-swagger-doc` and `swagger-ui-react` (and types).
2.  **Configuration**: Refactored `src/lib/swagger.ts` to support dual specs (`getPublicApiDocs` and `getInternalApiDocs`).
3.  **UI Pages**:
    - `src/app/api-doc/page.tsx`: Renders Public API docs.
    - `src/app/api-doc/internal/page.tsx`: Renders Internal API docs.
4.  **Annotations**: Added JSDoc comments to both integration and internal routes.
5.  **New Endpoints**: Added `DELETE /api/integrations/appointments` for cancelling appointments.

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
