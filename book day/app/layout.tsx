import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "读书日年度书单",
  description: "年度推荐书单，以高质感 Bento Grid 呈现每一本值得重读的书。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
