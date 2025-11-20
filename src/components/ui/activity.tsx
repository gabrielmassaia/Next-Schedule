import React from "react";

interface ActivityProps {
  mode: "visible" | "hidden";
  children: React.ReactNode;
}

export function Activity({ mode, children }: ActivityProps) {
  return (
    <div style={{ display: mode === "hidden" ? "none" : "contents" }}>
      {children}
    </div>
  );
}
