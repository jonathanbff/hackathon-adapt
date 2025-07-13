import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Edu One",
  description: "Education Platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <ClerkProvider>
        <body>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
