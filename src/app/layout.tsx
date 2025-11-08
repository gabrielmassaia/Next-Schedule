import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { ReactQueryProvider } from "@/providers/react-query";

const manrope = Manrope({
  variable: "--font-monrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next Schedule",
  description: "Plataforma de agendamentos para clínicas de diferentes nichos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} bg-slate-100 text-slate-900 antialiased`}>
        <ReactQueryProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </ReactQueryProvider>
        <Toaster position="bottom-center" richColors theme="light" />
      </body>
    </html>
  );
}
