import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '2BOTS — Claude & ChatGPT Together',
  description: 'Talk to Claude and ChatGPT at the same time. They help you together, debate each other, and keep each other honest.',
  openGraph: {
    title: '2BOTS — Claude & ChatGPT Together',
    description: 'Talk to Claude and ChatGPT at the same time.',
    url: 'https://2bots.ai',
    siteName: '2BOTS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2BOTS — Claude & ChatGPT Together',
    description: 'Talk to Claude and ChatGPT at the same time.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="320f471d-54ca-4148-a5bc-d799cdf1c3d0"></script>
      </head>
      <body className="bg-bot-bg text-bot-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
