import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressBar } from "@/components/progress-bar";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Grit & Grain",
  description:
    "The AI-powered ranch assistant — stop relying on memory, start relying on history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider>
          <ProgressBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
