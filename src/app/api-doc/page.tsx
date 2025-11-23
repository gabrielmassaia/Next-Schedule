import "swagger-ui-react/swagger-ui.css";

import SwaggerUI from "swagger-ui-react";

import { getPublicApiDocs } from "@/lib/swagger";

export default async function ApiDocPage() {
  const spec = await getPublicApiDocs();
  return (
    <div className="container mx-auto p-4">
      <SwaggerUI spec={spec} />
    </div>
  );
}
