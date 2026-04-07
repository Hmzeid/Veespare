"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import OrderCard from "@/components/OrderCard";
import { FunnelIcon } from "@heroicons/react/24/outline";

type OrderStatus = "new" | "confirmed" | "prepared" | "shipped";

interface KanbanOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  timeElapsed: number;
  status: OrderStatus;
}

const initialOrders: KanbanOrder[] = [
  { id: "1", orderNumber: "1024", customerName: "أحمد محمد", total: 2450, itemsCount: 3, timeElapsed: 15, status: "new" },
  { id: "2", orderNumber: "1025", customerName: "فاطمة علي", total: 1800, itemsCount: 2, timeElapsed: 8, status: "new" },
  { id: "3", orderNumber: "1026", customerName: "محمود حسن", total: 950, itemsCount: 1, timeElapsed: 45, status: "new" },
  { id: "4", orderNumber: "1020", customerName: "سارة إبراهيم", total: 3200, itemsCount: 4, timeElapsed: 120, status: "confirmed" },
  { id: "5", orderNumber: "1021", customerName: "عمر خالد", total: 1600, itemsCount: 2, timeElapsed: 90, status: "confirmed" },
  { id: "6", orderNumber: "1018", customerName: "نور الدين", total: 4500, itemsCount: 5, timeElapsed: 180, status: "prepared" },
  { id: "7", orderNumber: "1019", customerName: "ياسمين أحمد", total: 2100, itemsCount: 3, timeElapsed: 150, status: "prepared" },
  { id: "8", orderNumber: "1015", customerName: "حسين محمد", total: 5200, itemsCount: 6, timeElapsed: 360, status: "shipped" },
  { id: "9", orderNumber: "1016", customerName: "مريم عادل", total: 1400, itemsCount: 2, timeElapsed: 300, status: "shipped" },
  { id: "10", orderNumber: "1017", customerName: "كريم سعيد", total: 3800, itemsCount: 4, timeElapsed: 240, status: "shipped" },
];

const columns: { status: OrderStatus; labelKey: string; color: string }[] = [
  { status: "new", labelKey: "orders.newOrders", color: "bg-blue-500" },
  { status: "confirmed", labelKey: "orders.confirmed", color: "bg-gold" },
  { status: "prepared", labelKey: "orders.prepared", color: "bg-purple-500" },
  { status: "shipped", labelKey: "orders.shipped", color: "bg-green-500" },
];

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<KanbanOrder[]>(initialOrders);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
    );
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedOrderId) {
      handleStatusUpdate(draggedOrderId, targetStatus);
      setDraggedOrderId(null);
    }
  };

  const getColumnOrders = (status: OrderStatus) =>
    orders.filter((o) => o.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("orders.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} طلب</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">{t("orders.filterByDate")}:</span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{t("from")}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{t("to")}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field w-auto"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = getColumnOrders(col.status);
          return (
            <div
              key={col.status}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h3 className="font-bold text-primary text-sm">{t(col.labelKey)}</h3>
                </div>
                <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-0">
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    orderNumber={order.orderNumber}
                    customerName={order.customerName}
                    total={order.total}
                    itemsCount={order.itemsCount}
                    timeElapsed={order.timeElapsed}
                    status={order.status}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                    onDragStart={(e) => handleDragStart(e, order.id)}
                  />
                ))}
                {colOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-300 text-sm">
                    لا توجد طلبات
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
