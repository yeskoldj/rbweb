
import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "../lib/languageContext";
import InstallPrompt from "../components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranger's Bakery - Repostería Dominicana",
  description: "Deliciosos pasteles y postres dominicanos hechos con amor para tus momentos especiales",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f472b6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Pacifico&display=swap" 
          rel="stylesheet" 
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#f472b6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ranger's Bakery" />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <InstallPrompt />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
