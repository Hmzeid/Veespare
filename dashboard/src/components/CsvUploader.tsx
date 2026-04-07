"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  ArrowUpTrayIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/i18n/useTranslation";

interface CsvUploaderProps {
  onUpload: (data: Record<string, string>[]) => void;
  onClose: () => void;
}

const productFields = [
  "nameAr",
  "nameEn",
  "category",
  "price",
  "stock",
  "condition",
  "partNumber",
  "description",
  "compatibleCars",
];

export default function CsvUploader({ onUpload, onClose }: CsvUploaderProps) {
  const { t } = useTranslation();
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"select" | "map" | "preview">("select");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length > 0) {
            setHeaders(data[0]);
            setCsvData(data.slice(1).filter((row) => row.some((cell) => cell?.trim())));
            setStep("map");
          }
        },
        encoding: "UTF-8",
      });
    },
    []
  );

  const handleMappingChange = (csvCol: string, productField: string) => {
    setColumnMapping((prev) => ({ ...prev, [csvCol]: productField }));
  };

  const getMappedData = (): Record<string, string>[] => {
    return csvData.map((row) => {
      const mapped: Record<string, string> = {};
      headers.forEach((header, idx) => {
        const field = columnMapping[header];
        if (field) {
          mapped[field] = row[idx] || "";
        }
      });
      return mapped;
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const mappedData = getMappedData();
      onUpload(mappedData);
    } catch {
      // Handle error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-primary">{t("csv.title")}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step: Select File */}
          {step === "select" && (
            <div className="text-center py-12">
              <TableCellsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5" />
                {t("csv.selectFile")}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step: Map Columns */}
          {step === "map" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {t("csv.rowsFound", { count: csvData.length })}
              </p>
              <div className="space-y-3 mb-6">
                {headers.map((header) => (
                  <div
                    key={header}
                    className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700 w-1/3">
                      {header}
                    </span>
                    <span className="text-gray-400">&#8594;</span>
                    <select
                      value={columnMapping[header] || ""}
                      onChange={(e) =>
                        handleMappingChange(header, e.target.value)
                      }
                      className="select-field flex-1"
                    >
                      <option value="">-- {t("csv.mapsTo")} --</option>
                      {productFields.map((field) => (
                        <option key={field} value={field}>
                          {t(`inventory.${field === "nameAr" ? "productName" : field === "nameEn" ? "productName" : field}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("preview")}
                  className="btn-primary"
                  disabled={Object.keys(columnMapping).length === 0}
                >
                  {t("csv.preview")}
                </button>
                <button
                  onClick={() => setStep("select")}
                  className="btn-secondary"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div>
              <div className="overflow-x-auto mb-6">
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.values(columnMapping)
                        .filter(Boolean)
                        .map((field) => (
                          <th key={field}>{field}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getMappedData()
                      .slice(0, 5)
                      .map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(columnMapping)
                            .filter(Boolean)
                            .map((field) => (
                              <td key={field}>{row[field]}</td>
                            ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {t("csv.rowsFound", { count: csvData.length })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? t("csv.uploading") : t("csv.uploadBtn")}
                </button>
                <button
                  onClick={() => setStep("map")}
                  className="btn-secondary"
                >
                  {t("previous")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
