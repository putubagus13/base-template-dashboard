// src/components/shared/month-picker.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type MonthPickerProps = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
};

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const goPrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  const goToNow = () => {
    const now = new Date();
    onChange(now.getFullYear(), now.getMonth() + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={goPrev}
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        type="button"
        onClick={goToNow}
        className="min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
      >
        {MONTH_NAMES[month - 1]} {year}
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={goNext}
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
