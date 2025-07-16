import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursor Analytics Dashboard",
  description: "Team usage analytics and insights for Cursor IDE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
