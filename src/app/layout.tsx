'use client';

import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/layout/auth-guard';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/login' || pathname === '/signup' || pathname.startsWith('/portal') || pathname.startsWith('/p/');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>The Snap Service — Wedding Studio Operating System</title>
        <meta name="description" content="Official luxury wedding photography quotation studio, booking schedule, and deliverables tracker." />
        <link rel="icon" href="/snap-service-logo.png?v=2" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/snap-service-logo.png?v=2" />
        <link rel="apple-touch-icon" href="/snap-service-logo.png?v=2" />
      </head>
      <body className="font-sans bg-[#FAF9F6] text-slate-800 antialiased min-h-screen" suppressHydrationWarning>
        <AuthGuard>
          {isStandalonePage ? (
            <main className="min-h-screen">{children}</main>
          ) : (
            <div className="min-h-screen flex flex-col md:flex-row">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
              </div>
            </div>
          )}
        </AuthGuard>
      </body>
    </html>
  );
}
