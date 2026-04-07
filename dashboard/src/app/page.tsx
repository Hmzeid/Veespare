"use client";

import { useTranslation } from "@/i18n/useTranslation";
import StatsCard from "@/components/StatsCard";
import RevenueChart from "@/components/RevenueChart";
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CubeIcon,
  StarIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

const mockRevenueData = [
  { date: "03/31", revenue: 12500 },
  { date: "04/01", revenue: 18200 },
  { date: "04/02", revenue: 9800 },
  { date: "04/03", revenue: 22100 },
  { date: "04/04", revenue: 15700 },
  { date: "04/05", revenue: 28400 },
  { date: "04/06", revenue: 19300 },
];

const mockRecentOrders = [
  { id: "ORD-1024", customer: "أحمد محمد", items: 3, total: 2450, status: "new" as const, date: "2026-04-06" },
  { id: "ORD-1023", customer: "محمد علي", items: 1, total: 850, status: "confirmed" as const, date: "2026-04-06" },
  { id: "ORD-1022", customer: "خالد إبراهيم", items: 5, total: 4200, status: "prepared" as const, date: "2026-04-05" },
  { id: "ORD-1021", customer: "سارة أحمد", items: 2, total: 1600, status: "shipped" as const, date: "2026-04-05" },
  { id: "ORD-1020", customer: "عمر حسن", items: 4, total: 3100, status: "shipped" as const, date: "2026-04-04" },
];

const mockTopProducts = [
  { name: "فلتر زيت تويوتا كورولا", sold: 48, revenue: 14400 },
  { name: "تيل فرامل هيونداي أكسنت", sold: 35, revenue: 10500 },
  { name: "شمعات إشعال كيا سيراتو", sold: 30, revenue: 6000 },
  { name: "سير مروحة نيسان صني", sold: 28, revenue: 5600 },
  { name: "فلتر هواء شيفروليه أوبترا", sold: 25, revenue: 5000 },
];

const mockLowStockAlerts = [
  { name: "طرمبة بنزين تويوتا", stock: 2, minStock: 5 },
  { name: "كشاف أمامي هيونداي", stock: 1, minStock: 3 },
  { name: "رديتر مياه كيا", stock: 3, minStock: 10 },
  { name: "دينمو شيفروليه", stock: 0, minStock: 5 },
];

const statusLabels: Record<string, { ar: string; class: string }> = {
  new: { ar: "جديد", class: "badge-blue" },
  confirmed: { ar: "مؤكد", class: "badge-yellow" },
  prepared: { ar: "جاهز", class: "badge-purple" },
  shipped: { ar: "تم الشحن", class: "badge-green" },
};

export default function DashboardHome() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("welcome")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("storeName")} - {t("dashboard")}</p>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        {mockLowStockAlerts.length > 0 && (
          <div className="alert-banner warning">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t("alerts.lowStock")}</p>
              <p className="text-xs">{t("alerts.lowStockMsg", { count: mockLowStockAlerts.length })}</p>
            </div>
          </div>
        )}
        <div className="alert-banner info">
          <BellAlertIcon className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{t("alerts.newOrders")}</p>
            <p className="text-xs">{t("alerts.newOrdersMsg", { count: 3 })}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<ShoppingCartIcon className="w-6 h-6" />}
          label={t("stats.todayOrders")}
          value="23"
          change={12}
          changeLabel={t("stats.comparedToYesterday")}
        />
        <StatsCard
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          label={t("stats.todayRevenue")}
          value={`18,450 ${t("egp")}`}
          change={8.5}
          changeLabel={t("stats.comparedToYesterday")}
        />
        <StatsCard
          icon={<CubeIcon className="w-6 h-6" />}
          label={t("stats.totalProducts")}
          value="342"
          change={-2}
          changeLabel={t("stats.comparedToYesterday")}
        />
        <StatsCard
          icon={<StarIcon className="w-6 h-6" />}
          label={t("stats.avgRating")}
          value="4.7"
          change={3}
          changeLabel={t("stats.comparedToYesterday")}
        />
      </div>

      {/* Revenue Chart + Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={mockRevenueData} height={280} />
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-primary mb-4">{t("topSelling")}</h2>
          <div className="space-y-3">
            {mockTopProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-7 h-7 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {product.sold} {t("pieces")} · {product.revenue.toLocaleString()} {t("egp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary">{t("orders.recentOrders")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("orders.orderNumber")}</th>
                <th>{t("orders.customerName")}</th>
                <th>{t("orders.itemsCount")}</th>
                <th>{t("orders.totalAmount")}</th>
                <th>{t("status")}</th>
                <th>{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium text-primary">#{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.items} {t("pieces")}</td>
                  <td className="font-bold text-accent">{order.total.toLocaleString()} {t("egp")}</td>
                  <td>
                    <span className={`badge ${statusLabels[order.status].class}`}>
                      {statusLabels[order.status].ar}
                    </span>
                  </td>
                  <td className="text-gray-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Detail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">{t("alerts.lowStock")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockLowStockAlerts.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">الحد الأدنى: {item.minStock}</span>
                <span className={`badge ${item.stock === 0 ? "badge-red" : "badge-yellow"}`}>
                  {item.stock === 0 ? "نفذ" : `${item.stock} متبقي`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
