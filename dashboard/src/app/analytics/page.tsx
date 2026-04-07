"use client";

import { useTranslation } from "@/i18n/useTranslation";
import RevenueChart from "@/components/RevenueChart";
import StatsCard from "@/components/StatsCard";
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const mockRevenueData = [
  { date: "03/08", revenue: 8500 },
  { date: "03/09", revenue: 12300 },
  { date: "03/10", revenue: 9800 },
  { date: "03/11", revenue: 15200 },
  { date: "03/12", revenue: 11600 },
  { date: "03/13", revenue: 7200 },
  { date: "03/14", revenue: 14800 },
  { date: "03/15", revenue: 18500 },
  { date: "03/16", revenue: 16200 },
  { date: "03/17", revenue: 13400 },
  { date: "03/18", revenue: 19100 },
  { date: "03/19", revenue: 22500 },
  { date: "03/20", revenue: 17800 },
  { date: "03/21", revenue: 9500 },
  { date: "03/22", revenue: 21300 },
  { date: "03/23", revenue: 24600 },
  { date: "03/24", revenue: 18900 },
  { date: "03/25", revenue: 20100 },
  { date: "03/26", revenue: 16700 },
  { date: "03/27", revenue: 12800 },
  { date: "03/28", revenue: 25400 },
  { date: "03/29", revenue: 22100 },
  { date: "03/30", revenue: 19800 },
  { date: "03/31", revenue: 14500 },
  { date: "04/01", revenue: 18200 },
  { date: "04/02", revenue: 9800 },
  { date: "04/03", revenue: 22100 },
  { date: "04/04", revenue: 15700 },
  { date: "04/05", revenue: 28400 },
  { date: "04/06", revenue: 19300 },
];

const mockBestsellers = [
  { name: "فلتر زيت تويوتا كورولا", sold: 148, revenue: 44400 },
  { name: "تيل فرامل هيونداي أكسنت", sold: 112, revenue: 50400 },
  { name: "شمعات إشعال كيا سيراتو", sold: 95, revenue: 19000 },
  { name: "سير مروحة نيسان صني", sold: 88, revenue: 17600 },
  { name: "فلتر هواء شيفروليه أوبترا", sold: 76, revenue: 13680 },
  { name: "مساعد أمامي نيسان صني", sold: 42, revenue: 50400 },
  { name: "طرمبة بنزين شيفروليه", sold: 38, revenue: 32300 },
];

const mockOrderStatus = [
  { status: "مكتملة", count: 245, color: "bg-green-500", percent: 68 },
  { status: "قيد الانتظار", count: 52, color: "bg-blue-500", percent: 14 },
  { status: "ملغاة", count: 38, color: "bg-red-500", percent: 11 },
  { status: "مرتجعة", count: 25, color: "bg-yellow-500", percent: 7 },
];

const mockGovernorates = [
  { name: "القاهرة", orders: 156, percent: 43 },
  { name: "الجيزة", orders: 89, percent: 25 },
  { name: "الإسكندرية", orders: 52, percent: 14 },
  { name: "المنصورة", orders: 28, percent: 8 },
  { name: "طنطا", orders: 18, percent: 5 },
  { name: "أسيوط", orders: 10, percent: 3 },
  { name: "الأقصر", orders: 7, percent: 2 },
];

export default function AnalyticsPage() {
  const { t } = useTranslation();

  const totalRevenue = mockRevenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = mockOrderStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("analytics.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("analytics.last30Days")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          label={t("analytics.revenue")}
          value={`${(totalRevenue / 1000).toFixed(0)}K ${t("egp")}`}
          change={14.2}
          changeLabel={t("analytics.last30Days")}
        />
        <StatsCard
          icon={<ShoppingCartIcon className="w-6 h-6" />}
          label={t("analytics.orders")}
          value={totalOrders.toString()}
          change={8}
          changeLabel={t("analytics.last30Days")}
        />
        <StatsCard
          icon={<ArrowPathIcon className="w-6 h-6" />}
          label={t("analytics.returnRate")}
          value="7%"
          change={-2}
          changeLabel={t("analytics.last30Days")}
        />
        <StatsCard
          icon={<StarIcon className="w-6 h-6" />}
          label={t("analytics.avgReview")}
          value="4.7 / 5"
          change={5}
          changeLabel={t("analytics.last30Days")}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={mockRevenueData} height={300} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestsellers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-primary mb-4">{t("analytics.bestsellers")}</h2>
          <div className="space-y-3">
            {mockBestsellers.map((product, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-7 h-7 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.sold} {t("pieces")}</p>
                </div>
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {product.revenue.toLocaleString()} {t("egp")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-primary mb-4">{t("analytics.orderStatus")}</h2>
          <div className="space-y-4">
            {mockOrderStatus.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{item.status}</span>
                  <span className="text-gray-500">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="font-bold text-primary">{t("total")}</span>
              <span className="font-bold text-primary">{totalOrders} طلب</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Governorates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary">{t("analytics.customerGovernorates")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("analytics.governorate")}</th>
                <th>{t("analytics.ordersCount")}</th>
                <th>{t("analytics.percentage")}</th>
                <th>التوزيع</th>
              </tr>
            </thead>
            <tbody>
              {mockGovernorates.map((gov, i) => (
                <tr key={i}>
                  <td className="text-gray-400">{i + 1}</td>
                  <td className="font-medium text-primary">{gov.name}</td>
                  <td>{gov.orders}</td>
                  <td>{gov.percent}%</td>
                  <td>
                    <div className="w-full max-w-[200px] bg-gray-100 rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${gov.percent}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
