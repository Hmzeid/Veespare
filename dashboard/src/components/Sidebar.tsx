"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";
import { useDashboardStore } from "@/store/dashboardStore";
import { useTranslation } from "@/i18n/useTranslation";

const navItems = [
  { key: "nav.home", href: "/", icon: HomeIcon },
  { key: "nav.inventory", href: "/inventory", icon: CubeIcon },
  { key: "nav.orders", href: "/orders", icon: ShoppingCartIcon },
  { key: "nav.pricing", href: "/pricing", icon: CurrencyDollarIcon },
  { key: "nav.analytics", href: "/analytics", icon: ChartBarIcon },
  { key: "nav.profile", href: "/profile", icon: UserCircleIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const { sidebarOpen, toggleSidebar, setLocale } = useDashboardStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 start-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 start-0 h-full bg-primary text-white z-40 transition-all duration-300 flex flex-col
          ${sidebarOpen ? "w-64" : "w-0 lg:w-20"} overflow-hidden`}
      >
        {/* Store Name */}
        <div className="p-6 border-b border-primary-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">
              V
            </div>
            <div
              className={`transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "lg:opacity-0"
              }`}
            >
              <h1 className="font-bold text-lg whitespace-nowrap">
                {t("storeName")}
              </h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                {t("dashboard")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={t(item.key)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    sidebarOpen ? "opacity-100" : "lg:opacity-0"
                  }`}
                >
                  {t(item.key)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-primary-light space-y-1">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="sidebar-link w-full"
          >
            <LanguageIcon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "lg:opacity-0"
              }`}
            >
              {locale === "ar" ? "English" : "العربية"}
            </span>
          </button>

          {/* Logout */}
          <button className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "lg:opacity-0"
              }`}
            >
              {t("nav.logout")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
