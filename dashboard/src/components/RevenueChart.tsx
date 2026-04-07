"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/i18n/useTranslation";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
  height?: number;
}

export default function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  const { t, locale } = useTranslation();

  const formatCurrency = (value: number) =>
    `${value.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} ${t("egp")}`;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-primary mb-4">
        {t("analytics.revenueChart")}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            reversed={locale === "ar"}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            orientation={locale === "ar" ? "right" : "left"}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), t("analytics.revenue")]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontFamily: "Cairo",
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#e94560"
            strokeWidth={2.5}
            dot={{ fill: "#e94560", r: 4 }}
            activeDot={{ r: 6, fill: "#e94560" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
