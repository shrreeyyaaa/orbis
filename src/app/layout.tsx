import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

// Google Sans Flex (SIL Open Font License) for body text and headings.
const googleSansBody = localFont({
  src: [
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Headings run one weight step heavier than the body so they stand out.
const googleSansHeading = localFont({
  src: [
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Medium.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-SemiBold.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Bold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Google_Sans_Flex/static/GoogleSansFlex_24pt-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orbis",
  description: "Track your family's complete net worth across every asset, in any currency.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${googleSansBody.variable} ${googleSansHeading.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
