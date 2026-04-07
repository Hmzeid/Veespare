"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import ProductForm from "@/components/ProductForm";
import CsvUploader from "@/components/CsvUploader";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface MockProduct {
  id: string;
  nameAr: string;
  oem: string;
  category: string;
  price: number;
  stock: number;
  minStockAlert: number;
  status: "active" | "inactive" | "draft";
  aiConfidence: number;
  aiCategorized: boolean;
}

const mockProducts: MockProduct[] = [
  { id: "1", nameAr: "فلتر زيت تويوتا كورولا 2020", oem: "90915-YZZD4", category: "engine", price: 300, stock: 45, minStockAlert: 10, status: "active", aiConfidence: 0.95, aiCategorized: true },
  { id: "2", nameAr: "تيل فرامل أمامي هيونداي أكسنت", oem: "58101-1RA00", category: "brakes", price: 450, stock: 3, minStockAlert: 5, status: "active", aiConfidence: 0.88, aiCategorized: true },
  { id: "3", nameAr: "شمعات إشعال كيا سيراتو", oem: "18855-10060", category: "electrical", price: 200, stock: 30, minStockAlert: 10, status: "active", aiConfidence: 0.72, aiCategorized: true },
  { id: "4", nameAr: "مساعد أمامي نيسان صني", oem: "E4302-1HM0A", category: "suspension", price: 1200, stock: 8, minStockAlert: 5, status: "active", aiConfidence: 0.91, aiCategorized: true },
  { id: "5", nameAr: "طرمبة بنزين شيفروليه أوبترا", oem: "96447440", category: "engine", price: 850, stock: 2, minStockAlert: 5, status: "active", aiConfidence: 0.65, aiCategorized: false },
  { id: "6", nameAr: "كشاف أمامي يمين BMW E90", oem: "63117182518", category: "electrical", price: 3500, stock: 1, minStockAlert: 3, status: "active", aiConfidence: 0.98, aiCategorized: true },
  { id: "7", nameAr: "رديتر مياه كيا سبورتاج", oem: "25310-2S550", category: "cooling", price: 1800, stock: 4, minStockAlert: 10, status: "active", aiConfidence: 0.82, aiCategorized: true },
  { id: "8", nameAr: "فلتر هواء MG ZS", oem: "10422543", category: "engine", price: 180, stock: 0, minStockAlert: 5, status: "inactive", aiConfidence: 0.55, aiCategorized: false },
  { id: "9", nameAr: "سير توقيت ميتسوبيشي لانسر", oem: "1145A079", category: "engine", price: 650, stock: 12, minStockAlert: 5, status: "active", aiConfidence: 0.93, aiCategorized: true },
  { id: "10", nameAr: "دينمو هيونداي توسان", oem: "37300-2G400", category: "electrical", price: 2200, stock: 0, minStockAlert: 3, status: "inactive", aiConfidence: 0.89, aiCategorized: true },
];

const categories = [
  { value: "", label: "الكل" },
  { value: "engine", label: "محرك" },
  { value: "brakes", label: "فرامل" },
  { value: "suspension", label: "تعليق" },
  { value: "electrical", label: "كهرباء" },
  { value: "body", label: "هيكل" },
  { value: "interior", label: "داخلي" },
  { value: "transmission", label: "ناقل حركة" },
  { value: "cooling", label: "تبريد" },
  { value: "exhaust", label: "عادم" },
  { value: "steering", label: "توجيه" },
];

export default function InventoryPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCsvUploader, setShowCsvUploader] = useState(false);
  const [editProduct, setEditProduct] = useState<MockProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const lowStockCount = mockProducts.filter((p) => p.stock < p.minStockAlert).length;

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch = p.nameAr.includes(search) || p.oem.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getStatusBadge = (product: MockProduct) => {
    if (product.stock === 0) return <span className="badge badge-red">{t("inventory.outOfStock")}</span>;
    if (product.stock < product.minStockAlert) return <span className="badge badge-yellow">{t("inventory.lowStock")}</span>;
    return <span className="badge badge-green">{t("inventory.inStock")}</span>;
  };

  const getAiBadge = (product: MockProduct) => {
    const confidence = Math.round(product.aiConfidence * 100);
    if (product.aiConfidence >= 0.85) {
      return (
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-4 h-4 text-green-500" />
          <span className="badge badge-green">{confidence}%</span>
        </div>
      );
    }
    if (product.aiConfidence >= 0.7) {
      return (
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-4 h-4 text-yellow-500" />
          <span className="badge badge-yellow">{confidence}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <SparklesIcon className="w-4 h-4 text-red-500" />
        <span className="badge badge-red">{confidence}% - {t("inventory.manualReview")}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("inventory.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">{filteredProducts.length} منتج</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCsvUploader(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            {t("inventory.bulkUpload")}
          </button>
          <button
            onClick={() => { setEditProduct(null); setShowProductForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            {t("inventory.addProduct")}
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="alert-banner danger">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            {t("inventory.stockAlert", { count: lowStockCount })}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
          <input
            type="text"
            placeholder={t("inventory.searchProducts")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field ps-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="select-field w-full sm:w-48"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("inventory.productName")}</th>
              <th>OEM</th>
              <th>{t("inventory.category")}</th>
              <th>{t("inventory.price")} ({t("egp")})</th>
              <th>{t("inventory.stock")}</th>
              <th>{t("status")}</th>
              <th>{t("inventory.aiCategorized")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
              <tr key={product.id}>
                <td className="font-medium text-primary">{product.nameAr}</td>
                <td className="text-gray-500 font-mono text-xs">{product.oem}</td>
                <td>
                  <span className="badge badge-blue">
                    {t(`inventory.categories.${product.category}`)}
                  </span>
                </td>
                <td className="font-bold">{product.price.toLocaleString()}</td>
                <td>
                  <span className={product.stock < product.minStockAlert ? "text-red-600 font-bold" : ""}>
                    {product.stock}
                  </span>
                  {product.stock < product.minStockAlert && product.stock > 0 && (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 inline ms-1" />
                  )}
                </td>
                <td>{getStatusBadge(product)}</td>
                <td>{getAiBadge(product)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditProduct(product); setShowProductForm(true); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredProducts.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <span className="text-sm text-gray-500">
            {t("showing")} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} {t("of")} {filteredProducts.length} {t("results")}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === i + 1
                    ? "bg-accent text-white"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CubeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("noData")}</p>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          isEdit={!!editProduct}
          initialData={editProduct ? {
            nameAr: editProduct.nameAr,
            category: editProduct.category,
            price: editProduct.price,
            stock: editProduct.stock,
            partNumber: editProduct.oem,
          } : undefined}
          onSubmit={(data) => {
            console.log("Product data:", data);
            setShowProductForm(false);
          }}
          onClose={() => setShowProductForm(false)}
        />
      )}

      {/* CSV Uploader Modal */}
      {showCsvUploader && (
        <CsvUploader
          onUpload={(data) => {
            console.log("CSV data:", data);
            setShowCsvUploader(false);
          }}
          onClose={() => setShowCsvUploader(false)}
        />
      )}
    </div>
  );
}
