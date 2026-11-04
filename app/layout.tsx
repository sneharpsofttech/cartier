import type { Metadata } from "next";
import localFont from "next/font/local";
import PageLoader from "@/components/steps/PageLoader";
import RouteProgress from "@/components/steps/RouteProgress";
import "./globals.css";

// Marcellus ships with the app (from @fontsource), so nothing is fetched from
// Google at build or start-up. It is used for headings and text alike.
const display = localFont({
  variable: "--font-display",
  src: "../node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff2",
  weight: "400",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const text = localFont({
  variable: "--font-text",
  src: "../node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff2",
  weight: "400",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "DAZORA · Design Your Engagement Ring",
  description: "Choose a diamond and a setting, then see your ring in 3D and on your hand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables go on <html> so the tokens on :root can use them. The script flags the
    // page as loading before it paints (the loader clears the flag), hence the hydration warning off.
    <html lang="en" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // A safety net clears the flag even if the loader never runs.
            __html:
              "document.documentElement.setAttribute('data-loading','');" +
              "setTimeout(function(){document.documentElement.removeAttribute('data-loading')},7000);",
          }}
        />
      </head>
      <body>
        <PageLoader />
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
