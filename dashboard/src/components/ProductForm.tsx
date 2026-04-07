"use client";

import { useState } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/i18n/useTranslation";

interface ProductFormData {
  nameAr: string;
  nameEn: string;
  category: string;
  price: number;
  stock: number;
  condition: "new" | "used" | "refurbished";
  partNumber: string;
  description: string;
  compatibleCars: string[];
  images: File[];
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onClose: () => void;
  isEdit?: boolean;
}

const carBrands = [
  "Toyota", "Hyundai", "Kia", "Nissan", "Chevrolet",
  "BMW", "Mercedes", "MG", "Chery", "BYD",
  "Suzuki", "Mitsubishi", "Honda", "Peugeot", "Fiat",
];

export default function ProductForm({
  initialData,
  onSubmit,
  onClose,
  isEdit = false,
}: ProductFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    nameAr: initialData?.nameAr || "",
    nameEn: initialData?.nameEn || "",
    category: initialData?.category || "engine",
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    condition: initialData?.condition || "new",
    partNumber: initialData?.partNumber || "",
    description: initialData?.description || "",
    compatibleCars: initialData?.compatibleCars || [],
    images: [],
  });

  const categories = [
    "engine", "brakes", "suspension", "electrical", "body",
    "interior", "transmission", "cooling", "exhaust", "steering",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const toggleCar = (car: string) => {
    setFormData((prev) => ({
      ...prev,
      compatibleCars: prev.compatibleCars.includes(car)
        ? prev.compatibleCars.filter((c) => c !== car)
        : [...prev.compatibleCars, car],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...Array.from(e.target.files!)],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-primary">
            {isEdit ? t("edit") : t("inventory.addProduct")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.productName")} (عربي)
              </label>
              <input
                type="text"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.productName")} (English)
              </label>
              <input
                type="text"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Category and Part Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.category")}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="select-field"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`inventory.categories.${cat}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.partNumber")}
              </label>
              <input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Price, Stock, Condition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.price")} ({t("egp")})
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input-field"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.stock")}
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="input-field"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("inventory.condition")}
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="select-field"
              >
                <option value="new">{t("inventory.newPart")}</option>
                <option value="used">{t("inventory.usedPart")}</option>
                <option value="refurbished">{t("inventory.refurbished")}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("inventory.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Compatible Cars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("inventory.compatibleCars")}
            </label>
            <div className="flex flex-wrap gap-2">
              {carBrands.map((car) => (
                <button
                  key={car}
                  type="button"
                  onClick={() => toggleCar(car)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    formData.compatibleCars.includes(car)
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-gray-600 border-gray-200 hover:border-accent"
                  }`}
                >
                  {car}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("inventory.images")}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <PhotoIcon className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">{t("upload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {formData.images.map((img, i) => (
                <div
                  key={i}
                  className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 relative"
                >
                  <span className="truncate px-2">{img.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        images: prev.images.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="absolute -top-2 -end-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button type="submit" className="btn-primary">
              {isEdit ? t("save") : t("inventory.addProduct")}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
