import { useCallback } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import ar from "./ar";
import en from "./en";

const translations: Record<string, Record<string, unknown>> = { ar, en };

export function useTranslation() {
  const locale = useDashboardStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = translations[locale];

      for (const k of keys) {
        if (value && typeof value === "object" && k in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      let result = String(value);

      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(`{{${paramKey}}}`, String(paramValue));
        });
      }

      return result;
    },
    [locale]
  );

  return { t, locale };
}
