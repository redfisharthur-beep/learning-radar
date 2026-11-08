import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "學習雷達 Learning Radar",
  description: "國小與國中 AI 智慧段考複習平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant-TW"><body>{children}</body></html>;
}
