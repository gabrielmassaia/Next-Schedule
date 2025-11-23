import "swagger-ui-react/swagger-ui.css";

import SwaggerUI from "swagger-ui-react";

import { getInternalApiDocs } from "@/lib/swagger";

export default async function InternalApiDocPage() {
  const spec = await getInternalApiDocs();
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Internal API Documentation</h1>
      <SwaggerUI spec={spec} />
    </div>
  );
}
