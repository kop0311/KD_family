
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { SkipLink } from '@/components/accessibility/AccessibleComponents';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KD之家 - 家务积分系统',
  description: '现代化家务积分管理系统',
  keywords: ['家务', '积分', '管理', '家庭', 'KD之家'],
  authors: [{ name: 'KD Family' }],
  creator: 'KD Family',
  publisher: 'KD Family',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'KD之家 - 家务积分系统',
    description: '现代化家务积分管理系统',
    url: '/',
    siteName: 'KD之家',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KD之家 - 家务积分系统'
      }
    ],
    locale: 'zh_CN',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KD之家 - 家务积分系统',
    description: '现代化家务积分管理系统',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#f97316'
      }
    ]
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SkipLink href="#main-content">跳转到主要内容</SkipLink>

        <ClientProviders>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <main id="main-content" className="focus:outline-none" tabIndex={-1}>
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
