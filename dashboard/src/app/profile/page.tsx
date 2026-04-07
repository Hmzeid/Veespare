"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface WorkingHour {
  day: string;
  dayLabel: string;
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
  { day: "saturday", dayLabel: "السبت", open: "09:00", close: "22:00", isClosed: false },
  { day: "sunday", dayLabel: "الأحد", open: "09:00", close: "22:00", isClosed: false },
  { day: "monday", dayLabel: "الاثنين", open: "09:00", close: "22:00", isClosed: false },
  { day: "tuesday", dayLabel: "الثلاثاء", open: "09:00", close: "22:00", isClosed: false },
  { day: "wednesday", dayLabel: "الأربعاء", open: "09:00", close: "22:00", isClosed: false },
  { day: "thursday", dayLabel: "الخميس", open: "10:00", close: "20:00", isClosed: false },
  { day: "friday", dayLabel: "الجمعة", open: "", close: "", isClosed: true },
];

const initialDeliveryZones: DeliveryZone[] = [
  { zone: "القاهرة - وسط البلد", fee: 30, time: "1-2 ساعة" },
  { zone: "القاهرة - مدينة نصر", fee: 35, time: "1-3 ساعة" },
  { zone: "الجيزة - الدقي", fee: 40, time: "2-3 ساعة" },
  { zone: "الجيزة - 6 أكتوبر", fee: 50, time: "3-4 ساعة" },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const [nameAr, setNameAr] = useState("متجر فيبارتس");
  const [nameEn, setNameEn] = useState("VeeParts Store");
  const [description, setDescription] = useState(
    "متجر متخصص في قطع غيار السيارات الأصلية والمستعملة. نوفر جميع أنواع القطع لمختلف ماركات السيارات بأفضل الأسعار مع ضمان الجودة."
  );
  const [phone, setPhone] = useState("+20 100 123 4567");
  const [email, setEmail] = useState("info@veeparts.com");
  const [address, setAddress] = useState("القاهرة، مدينة نصر، شارع عباس العقاد");

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(initialWorkingHours);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(initialDeliveryZones);

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours((prev) =>
      prev.map((wh, i) => (i === index ? { ...wh, [field]: value } : wh))
    );
  };

  const addDeliveryZone = () => {
    setDeliveryZones((prev) => [...prev, { zone: "", fee: 0, time: "" }]);
  };

  const removeDeliveryZone = (index: number) => {
    setDeliveryZones((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeliveryZone = (index: number, field: keyof DeliveryZone, value: string | number) => {
    setDeliveryZones((prev) =>
      prev.map((dz, i) => (i === index ? { ...dz, [field]: value } : dz))
    );
  };

  const handleSave = () => {
    console.log("Profile data:", { nameAr, nameEn, description, phone, email, address, workingHours, deliveryZones });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("profile.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة بيانات المتجر</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">تم الحفظ بنجاح</span>
          </div>
        )}
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
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("profile.storeNameEn")}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {workingHours.map((wh, i) => (
            <div key={wh.day} className="flex flex-wrap items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <span className="w-24 text-sm font-medium text-gray-700">{wh.dayLabel}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wh.isClosed}
                  onChange={(e) => updateWorkingHour(i, "isClosed", e.target.checked)}
                  className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                />
                <span className="text-sm text-gray-500">{t("profile.closed")}</span>
              </label>
              {!wh.isClosed && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">{t("profile.openTime")}</label>
                  <input
                    type="time"
                    value={wh.open}
                    onChange={(e) => updateWorkingHour(i, "open", e.target.value)}
                    className="input-field w-auto text-sm"
                  />
                  <span className="text-gray-300">-</span>
                  <label className="text-xs text-gray-400">{t("profile.closeTime")}</label>
                  <input
                    type="time"
                    value={wh.close}
                    onChange={(e) => updateWorkingHour(i, "close", e.target.value)}
                    className="input-field w-auto text-sm"
                  />
                </div>
              )}
              {wh.isClosed && (
                <span className="text-sm text-red-400">{t("profile.closed")}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">{t("profile.deliveryZones")}</h2>
          <button onClick={addDeliveryZone} className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3">
            <PlusIcon className="w-4 h-4" />
            {t("profile.addZone")}
          </button>
        </div>
        <div className="space-y-3">
          {deliveryZones.map((dz, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-400 mb-1">{t("profile.zone")}</label>
                <input
                  type="text"
                  value={dz.zone}
                  onChange={(e) => updateDeliveryZone(i, "zone", e.target.value)}
                  className="input-field text-sm"
                  placeholder="اسم المنطقة"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-400 mb-1">{t("profile.deliveryFee")} ({t("egp")})</label>
                <input
                  type="number"
                  value={dz.fee}
                  onChange={(e) => updateDeliveryZone(i, "fee", Number(e.target.value))}
                  className="input-field text-sm"
                  min="0"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-400 mb-1">{t("profile.deliveryTime")}</label>
                <input
                  type="text"
                  value={dz.time}
                  onChange={(e) => updateDeliveryZone(i, "time", e.target.value)}
                  className="input-field text-sm"
                  placeholder="مثال: 1-2 ساعة"
                />
              </div>
              <div className="pt-5">
                <button
                  onClick={() => removeDeliveryZone(i)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {deliveryZones.length === 0 && (
            <p className="text-center py-6 text-gray-400 text-sm">لا توجد مناطق توصيل. أضف منطقة جديدة.</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary text-lg px-10 py-3">
          {t("profile.saveChanges")}
        </button>
      </div>
    </div>
  );
}
