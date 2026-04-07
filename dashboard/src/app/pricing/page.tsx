"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface PricingItem {
  id: string;
  name: string;
  myPrice: number;
  marketAvg: number;
  diffPercent: number;
  status: "competitive" | "below" | "above";
  history: { date: string; price: number }[];
}

const mockPricingData: PricingItem[] = [
  {
    id: "1", name: "فلتر زيت تويوتا كورولا", myPrice: 300, marketAvg: 320, diffPercent: -6.25, status: "below",
    history: [{ date: "01/2026", price: 250 }, { date: "02/2026", price: 270 }, { date: "03/2026", price: 290 }, { date: "04/2026", price: 300 }],
  },
  {
    id: "2", name: "تيل فرامل هيونداي أكسنت", myPrice: 450, marketAvg: 430, diffPercent: 4.65, status: "above",
    history: [{ date: "01/2026", price: 400 }, { date: "02/2026", price: 420 }, { date: "03/2026", price: 440 }, { date: "04/2026", price: 450 }],
  },
  {
    id: "3", name: "شمعات إشعال كيا سيراتو", myPrice: 200, marketAvg: 205, diffPercent: -2.44, status: "competitive",
    history: [{ date: "01/2026", price: 180 }, { date: "02/2026", price: 190 }, { date: "03/2026", price: 195 }, { date: "04/2026", price: 200 }],
  },
  {
    id: "4", name: "مساعد أمامي نيسان صني", myPrice: 1200, marketAvg: 1100, diffPercent: 9.09, status: "above",
    history: [{ date: "01/2026", price: 1000 }, { date: "02/2026", price: 1100 }, { date: "03/2026", price: 1150 }, { date: "04/2026", price: 1200 }],
  },
  {
    id: "5", name: "طرمبة بنزين شيفروليه أوبترا", myPrice: 850, marketAvg: 900, diffPercent: -5.56, status: "below",
    history: [{ date: "01/2026", price: 750 }, { date: "02/2026", price: 800 }, { date: "03/2026", price: 830 }, { date: "04/2026", price: 850 }],
  },
  {
    id: "6", name: "كشاف أمامي BMW E90", myPrice: 3500, marketAvg: 3800, diffPercent: -7.89, status: "below",
    history: [{ date: "01/2026", price: 3200 }, { date: "02/2026", price: 3300 }, { date: "03/2026", price: 3400 }, { date: "04/2026", price: 3500 }],
  },
  {
    id: "7", name: "رديتر مياه كيا سبورتاج", myPrice: 1800, marketAvg: 1750, diffPercent: 2.86, status: "competitive",
    history: [{ date: "01/2026", price: 1600 }, { date: "02/2026", price: 1700 }, { date: "03/2026", price: 1750 }, { date: "04/2026", price: 1800 }],
  },
  {
    id: "8", name: "سير توقيت ميتسوبيشي لانسر", myPrice: 650, marketAvg: 620, diffPercent: 4.84, status: "above",
    history: [{ date: "01/2026", price: 550 }, { date: "02/2026", price: 580 }, { date: "03/2026", price: 620 }, { date: "04/2026", price: 650 }],
  },
];

const mockRecommendations = [
  {
    product: "مساعد أمامي نيسان صني",
    action: "decrease" as const,
    reason: "سعرك أعلى من السوق بنسبة 9%. خفض السعر إلى 1,150 ج.م قد يزيد المبيعات بنسبة 15%.",
    suggestedPrice: 1150,
    potentialRevenue: "+2,300 ج.م/شهر",
  },
  {
    product: "كشاف أمامي BMW E90",
    action: "increase" as const,
    reason: "سعرك أقل من السوق بنسبة 8%. يمكنك رفع السعر إلى 3,650 ج.م مع الحفاظ على التنافسية.",
    suggestedPrice: 3650,
    potentialRevenue: "+450 ج.م/شهر",
  },
  {
    product: "فلتر زيت تويوتا كورولا",
    action: "increase" as const,
    reason: "هذا المنتج الأكثر مبيعاً لديك. رفع السعر 10 ج.م لن يؤثر على المبيعات.",
    suggestedPrice: 310,
    potentialRevenue: "+480 ج.م/شهر",
  },
];

const comparisonChartData = mockPricingData.slice(0, 6).map((p) => ({
  name: p.name.length > 18 ? p.name.substring(0, 18) + "..." : p.name,
  myPrice: p.myPrice,
  marketAvg: p.marketAvg,
}));

export default function PricingPage() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<PricingItem | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "competitive":
        return <span className="badge badge-green">{t("pricing.competitive")}</span>;
      case "below":
        return <span className="badge badge-blue">{t("pricing.belowMarket")}</span>;
      case "above":
        return <span className="badge badge-yellow">{t("pricing.aboveMarket")}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("pricing.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">مقارنة أسعارك بمتوسط السوق</p>
      </div>

      {/* Bar Chart with Recharts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">{t("pricing.comparisonChart")}</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontFamily: "Cairo",
              }}
            />
            <Legend />
            <Bar dataKey="myPrice" name={t("pricing.myPrice")} fill="#e94560" radius={[4, 4, 0, 0]} />
            <Bar dataKey="marketAvg" name={t("pricing.marketAvg")} fill="#f5a623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pricing Table */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("inventory.productName")}</th>
                  <th>{t("pricing.myPrice")} ({t("egp")})</th>
                  <th>{t("pricing.marketAvg")} ({t("egp")})</th>
                  <th>الفرق %</th>
                  <th>{t("status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockPricingData.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-primary">{item.name}</td>
                    <td className="font-bold">{item.myPrice.toLocaleString()}</td>
                    <td className="text-gray-500">{item.marketAvg.toLocaleString()}</td>
                    <td>
                      <span className={`font-bold ${item.diffPercent > 0 ? "text-red-500" : item.diffPercent < -5 ? "text-green-500" : "text-gray-600"}`}>
                        {item.diffPercent > 0 ? "+" : ""}{item.diffPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <button
                        onClick={() => setSelectedProduct(item)}
                        className="text-accent text-sm hover:underline flex items-center gap-1"
                      >
                        <ClockIcon className="w-4 h-4" />
                        {t("pricing.priceHistory")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price History Panel */}
        <div className="space-y-6">
          {selectedProduct ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-primary mb-1">{t("pricing.priceHistory")}</h3>
              <p className="text-sm text-gray-500 mb-4">{selectedProduct.name}</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selectedProduct.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontFamily: "Cairo",
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#e94560" strokeWidth={2} dot={{ fill: "#e94560", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-400">
              <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">اختر منتج لعرض تاريخ الأسعار</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <SparklesIcon className="w-6 h-6 text-gold" />
          <h2 className="text-lg font-bold text-primary">{t("pricing.aiRecommendations")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockRecommendations.map((rec, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                {rec.action === "decrease" ? (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-accent" />
                )}
                <h3 className="font-bold text-primary text-sm">{rec.product}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{rec.reason}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">السعر المقترح</p>
                  <p className="font-bold text-primary">{rec.suggestedPrice.toLocaleString()} {t("egp")}</p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-gray-400">{t("pricing.potentialRevenue")}</p>
                  <p className="font-bold text-green-600">{rec.potentialRevenue}</p>
                </div>
              </div>
              <button className="w-full mt-3 btn-primary text-sm py-2 flex items-center justify-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                تطبيق
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
