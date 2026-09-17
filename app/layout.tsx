import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "TradeWithCupang — Coming Soon",
  description:
    "Something is swimming your way. Ready to Trade with Cupang ?",
  themeColor: "#ffffff",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%23eb1935'/%3E%3Ctext x='9' y='29' font-family='Arial' font-size='28' fill='white'%3EC%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    title: "TradeWithCupang — Coming Soon",
    description: "Something is swimming your way.",
    images: ["/img/fish-fallback.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
