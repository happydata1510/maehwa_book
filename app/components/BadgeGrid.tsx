"use client";
import React from "react";

type BadgeGridProps = {
  totalCount: number;
};

export default function BadgeGrid({ totalCount }: BadgeGridProps) {
  const thousandBadges = Math.floor(totalCount / 1000);
  // 100 ~ 1000 구간 진행도 (100 이상만 표시)
  const progress = Math.max(0, Math.min(900, totalCount - 100));
  const filledCells = Math.floor(progress / 100);
  const cells = Array.from({ length: 10 }, (_, i) => i < filledCells);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">총 {totalCount}권 읽음</div>
      {thousandBadges > 0 && (
        <div className="flex gap-2 items-center">
          {Array.from({ length: thousandBadges }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-amber-300/80 text-amber-950 font-bold px-3 py-1 text-sm shadow-sm">
              🏆 1000권 달성!
            </div>
          ))}
        </div>
      )}
      <div className="p-3 border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
        <div className="text-xs text-gray-500 mb-2">100~1000권 사이 진행 쿠폰판</div>
        <div className="grid grid-cols-5 gap-2">
          {cells.map((filled, idx) => (
            <div
              key={idx}
              className={`h-10 rounded-lg border flex items-center justify-center text-xs ${
                filled ? "bg-pink-400 text-white border-pink-500" : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {filled ? "🌸" : `${(idx + 1) * 100}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

