import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Wind } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Urban Air Quality Assistant',
  description:
    'Real-time urban air quality, forecasts and personalized health guidance powered by open data and AI.',
  other: {
    'theme-color': '#f7fafb',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wind className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold sm:text-base">Urban Air Quality Assistant</p>
                  <p className="text-xs text-muted-foreground">Breathe informed</p>
                </div>
              </div>
              <ThemeToggleButton />
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6">
            {children}
          </main>
          <footer className="border-t bg-card/60">
            <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted-foreground">
              Data by Open-Meteo. Health guidance is general information, not medical advice.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

