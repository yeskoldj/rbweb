
import type { Metadata } from "next";
import { LanguageProvider } from "../lib/languageContext";
import { AuthProvider } from "../lib/authContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranger's Bakery - Repostería Dominicana",
  description: "Deliciosos pasteles y postres dominicanos hechos con amor para tus momentos especiales",
  manifest: "/manifest.json",
  themeColor: "#f472b6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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
        <meta name="theme-color" content="#f472b6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ranger's Bakery" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
