import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'Store Finder 品牌门店搜索引擎 - 实体专柜精准导航',
  description: '极简、即时、高精度的多品牌线下实体门店、专柜、商场楼层与电话导航引擎。覆盖全国34个省市。',
  keywords: ['门店搜索', '品牌专柜', 'New Balance', '商场楼层', '专卖店电话', '门店导航', 'Grey Store', '1906'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Store Finder',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
