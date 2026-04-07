"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface WorkingHour {
  day: string;
  dayKey: string;
  open: string;
  close: string;
  isClosed: boolean;
}

interface DeliveryZone {
  zone: string;
  fee: number;
  time: string;
}

const initialWorkingHours: WorkingHour[] = [
  { day: "السبت", dayKey: "saturday", open: "09:00", close: "21:00", isClosed: false },
  { day: "الأحد", dayKey: "sunday", open: "09:00", close: "21:00", isClosed: false },
  { day: "الاثنين", dayKey: "monday", open: "09:00", close: "21:00", isClosed: false },
  { day: "الثلاثاء", dayKey: "tuesday", open: "09:00", close: "21:00", isClosed: false },
  { day: "الأربعاء", dayKey: "wednesday", open: "09:00", close: "21:00", isClosed: false },
  { day: "الخميس", dayKey: "thursday", open: "09:00", close: "22:00", isClosed: false },
  { day: "الجمعة", dayKey: "friday", open: "14:00", close: "22:00", isClosed: false },
];

const initialZones: DeliveryZone[] = [
  { zone: "القاهرة - وسط البلد", fee: 30, time: "1-2 ساعة" },
  { zone: "القاهرة - مدينة نصر", fee: 35, time: "1-2 ساعة" },
  { zone: "الجيزة", fee: 45, time: "2-3 ساعات" },
  { zone: "6 أكتوبر", fee: 50, time: "2-4 ساعات" },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const [storeNameAr, setStoreNameAr] = useState("قطع غيار فيبارتس");
  const [storeNameEn, setStoreNameEn] = useState("VeeParts Auto Store");
  const [description, setDescription] = useState(
    "متجر متخصص في قطع غيار السيارات الأصلية والمستعملة. نوفر أفضل القطع بأسعار تنافسية مع خدمة توصيل سريعة لجميع أنحاء القاهرة والجيزة."
  );
  const [phone, setPhone] = useState("01012345678");
  const [email, setEmail] = useState("store@veeparts.com");
  const [address, setAddress] = useState("15 شارع السيارات، مدينة نصر، القاهرة");
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(initialWorkingHours);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(initialZones);
  const [saved, setSaved] = useState(false);

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const addDeliveryZone = () => {
    setDeliveryZones((prev) => [...prev, { zone: "", fee: 0, time: "" }]);
  };

  const updateDeliveryZone = (index: number, field: keyof DeliveryZone, value: string | number) => {
    setDeliveryZones((prev) =>
      prev.map((z, i) => (i === index ? { ...z, [field]: value } : z))
    );
  };

  const removeDeliveryZone = (index: number) => {
    setDeliveryZones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("profile.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">تعديل بيانات المتجر</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              تم الحفظ
            </>
          ) : (
            t("profile.saveChanges")
          )}
        </button>
      </div>

      {/* Logo & Cover */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">الصور</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("profile.logo")}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent transition-colors bg-gray-50">
              <PhotoIcon className="w-12 h-12 text-gray-300 mb-2" />
              <span className="text-sm text-gray-500">{t("profile.uploadLogo")}</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG (200x200 px)</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>

          {/* Cover Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("profile.coverImage")}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent transition-colors bg-gray-50">
              <PhotoIcon className="w-12 h-12 text-gray-300 mb-2" />
              <span className="text-sm text-gray-500">{t("profile.uploadCover")}</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG (1200x400 px)</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">بيانات المتجر</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("profile.storeNameAr")}
              </label>
              <input
                type="text"
                value={storeNameAr}
                onChange={(e) => setStoreNameAr(e.target.value)}
                className="input-field"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("profile.storeNameEn")}
              </label>
              <input
                type="text"
                value={storeNameEn}
                onChange={(e) => setStoreNameEn(e.target.value)}
                className="input-field"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("profile.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">{t("profile.contactInfo")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("profile.phone")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("profile.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("profile.address")}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4">{t("profile.workingHours")}</h2>
        <div className="space-y-3">
          {workingHours.map((hour, index) => (
            <div
              key={hour.dayKey}
              className={`flex flex-wrap items-center gap-4 p-3 rounded-lg border transition-colors ${
                hour.isClosed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100"
              }`}
            >
              <span className="text-sm font-medium text-gray-700 w-24">
                {hour.day}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hour.isClosed}
                  onChange={(e) => updateWorkingHour(index, "isClosed", e.target.checked)}
                  className="w-4 h-4 text-accent rounded focus:ring-accent"
                />
                <span className="text-sm text-gray-500">{t("profile.closed")}</span>
              </label>
              {!hour.isClosed && (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <label className="text-xs text-gray-400">{t("profile.openTime")}</label>
                  <input
                    type="time"
                    value={hour.open}
                    onChange={(e) => updateWorkingHour(index, "open", e.target.value)}
                    className="input-field w-32"
                  />
                  <span className="text-gray-300">-</span>
                  <label className="text-xs text-gray-400">{t("profile.closeTime")}</label>
                  <input
                    type="time"
                    value={hour.close}
                    onChange={(e) => updateWorkingHour(index, "close", e.target.value)}
                    className="input-field w-32"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">{t("profile.deliveryZones")}</h2>
          <button
            onClick={addDeliveryZone}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            {t("profile.addZone")}
          </button>
        </div>
        <div className="space-y-3">
          {deliveryZones.map((zone, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-400 mb-1">
                  {t("profile.zone")}
                </label>
                <input
                  type="text"
                  value={zone.zone}
                  onChange={(e) => updateDeliveryZone(index, "zone", e.target.value)}
                  className="input-field"
                  placeholder="اسم المنطقة"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-400 mb-1">
                  {t("profile.deliveryFee")} ({t("egp")})
                </label>
                <input
                  type="number"
                  value={zone.fee}
                  onChange={(e) => updateDeliveryZone(index, "fee", Number(e.target.value))}
                  className="input-field"
                  min="0"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs text-gray-400 mb-1">
                  {t("profile.deliveryTime")}
                </label>
                <input
                  type="text"
                  value={zone.time}
                  onChange={(e) => updateDeliveryZone(index, "time", e.target.value)}
                  className="input-field"
                  placeholder="مثال: 1-2 ساعة"
                />
              </div>
              <button
                onClick={() => removeDeliveryZone(index)}
                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors mt-5"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          {deliveryZones.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              لا توجد مناطق توصيل. أضف منطقة جديدة.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pb-8">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          {saved ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              تم الحفظ بنجاح
            </>
          ) : (
            t("profile.saveChanges")
          )}
        </button>
      </div>
    </div>
  );
}
