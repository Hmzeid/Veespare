"use client";

import {
  ClockIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/i18n/useTranslation";

interface OrderCardProps {
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  timeElapsed: number; // in minutes
  status: "new" | "confirmed" | "prepared" | "shipped";
  onStatusUpdate?: (newStatus: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function OrderCard({
  orderNumber,
  customerName,
  total,
  itemsCount,
  timeElapsed,
  status,
  onStatusUpdate,
  onDragStart,
}: OrderCardProps) {
  const { t } = useTranslation();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t("orders.minutes")}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ${t("orders.hours")} ${mins > 0 ? `${mins} ${t("orders.minutes")}` : ""}`;
  };

  const nextStatus: Record<string, { key: string; value: string }> = {
    new: { key: "orders.confirmOrder", value: "confirmed" },
    confirmed: { key: "orders.prepareOrder", value: "prepared" },
    prepared: { key: "orders.shipOrder", value: "shipped" },
  };

  const statusColors: Record<string, string> = {
    new: "border-s-4 border-s-blue-500",
    confirmed: "border-s-4 border-s-gold",
    prepared: "border-s-4 border-s-purple-500",
    shipped: "border-s-4 border-s-green-500",
  };

  return (
    <div
      className={`kanban-card ${statusColors[status]}`}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-primary text-sm">#{orderNumber}</span>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>{formatTime(timeElapsed)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <UserIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">{customerName}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <ShoppingBagIcon className="w-3.5 h-3.5" />
          <span>
            {itemsCount} {t("orders.itemsCount")}
          </span>
        </div>
        <span className="font-bold text-accent">
          {total.toLocaleString()} {t("egp")}
        </span>
      </div>

      {nextStatus[status] && onStatusUpdate && (
        <button
          onClick={() => onStatusUpdate(nextStatus[status].value)}
          className="w-full py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors"
        >
          {t(nextStatus[status].key)}
        </button>
      )}
    </div>
  );
}
