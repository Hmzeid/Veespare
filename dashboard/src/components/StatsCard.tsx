"use client";

import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
}

export default function StatsCard({
  icon,
  label,
  value,
  change,
  changeLabel,
}: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
        </div>
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        {isPositive ? (
          <ArrowUpIcon className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 text-red-500" />
        )}
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-gray-400 ms-1">{changeLabel}</span>
      </div>
    </div>
  );
}
