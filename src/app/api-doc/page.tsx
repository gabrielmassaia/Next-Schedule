import "swagger-ui-react/swagger-ui.css";

import SwaggerUI from "swagger-ui-react";

import { getApiDocs } from "@/lib/swagger";

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  return (
    <div className="container mx-auto p-4">
      <SwaggerUI spec={spec} />
    </div>
  );
}
