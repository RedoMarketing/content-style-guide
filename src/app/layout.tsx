import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Pin Sans substitute — geometric humanist sans, tall x-height.
const pinSans = Inter({
  variable: "--font-pin-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Display face for the board title.
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const basePath = process.env.BASE_PATH || "";

export const metadata: Metadata = {
  title: "Redo — Content Style Guide",
  description:
    "The Redo content system: how our videos move audiences from awareness to decision.",
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "any" },
      { url: `${basePath}/icon.png`, type: "image/png" },
    ],
    shortcut: `${basePath}/favicon.ico`,
    apple: `${basePath}/icon.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pinSans.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
