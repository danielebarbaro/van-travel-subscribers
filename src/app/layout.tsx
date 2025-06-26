import type { Metadata } from "next";
import { Sedgwick_Ave, Roboto } from "next/font/google";
import "./globals.css";

const sedgwickAve = Sedgwick_Ave({
  weight: '400',
  variable: "--font-sedgwick",
  subsets: ["latin"],
  display: 'swap',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  variable: "--font-roboto",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BarbiSurfer - Viaggi in Camper a 99€ | Una Settimana di Avventura",
  description: "Scopri l'Italia e l'Europa con i nostri viaggi in camper di una settimana a soli 99€. Itinerari curati, avventure indimenticabili. Registrati per essere tra i primi!",
  keywords: "camper, viaggi, italia, europa, vacanze, avventura, itinerari, 99 euro, barbisurfer",
  authors: [{ name: "BarbiSurfer" }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "BarbiSurfer - Viaggi in Camper a 99€",
    description: "Viaggi in camper di una settimana a soli 99€. Scopri l'Italia e l'Europa!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${sedgwickAve.variable} ${roboto.variable} font-roboto antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
