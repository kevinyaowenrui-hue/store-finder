import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Store Finder 品牌门店搜索引擎 - 实体专柜精准导航',
  description: '极简、即时、高精度的多品牌线下实体门店、专柜、商场楼层与电话导航引擎。首期试点 New Balance。',
  keywords: ['门店搜索', '品牌专柜', 'New Balance', '商场楼层', '专卖店电话', '门店导航'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#fafafc] text-zinc-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
