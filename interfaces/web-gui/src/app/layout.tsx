import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/quantic-tokens.css";
import "../styles/quantic-dark-tokens.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brand Asset Browser",
  description: "Search and download CIQ brand assets",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--quantic-font-family-body)' }}
      >
        {children}
      </body>
    </html>
  );
}
