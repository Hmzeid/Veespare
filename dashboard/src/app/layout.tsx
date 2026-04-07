"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useDashboardStore } from "@/store/dashboardStore";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, sidebarOpen } = useDashboardStore();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <title>VeeParts - لوحة التحكم</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-cairo bg-gray-50 min-h-screen">
        <Sidebar />
        <main
          className={`transition-all duration-300 min-h-screen ${
            sidebarOpen ? "lg:ps-64" : "lg:ps-20"
          } pt-16 lg:pt-0`}
        >
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
