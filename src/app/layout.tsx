import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} bg-background text-foreground antialiased`}
      >
        <ReactQueryProvider>
          <NuqsAdapter>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </NuqsAdapter>
        </ReactQueryProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
