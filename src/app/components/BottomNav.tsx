import React, { useState } from "react";
import { Link } from "react-router";
import {
  Home,
  PieChart,
  Bot,
  BarChart3,
  Plus,
  Camera,
  Mic,
} from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Tổng quan", activeColor: "text-emerald-300" },
    { path: "/budget", icon: PieChart, label: "Ngân sách", activeColor: "text-orange-300" },
    { path: "/transactions", icon: Plus, label: "Thêm", isCenter: true },
    { path: "/reports", icon: BarChart3, label: "Báo cáo", activeColor: "text-violet-300" },
    { path: "/ai-advisor", icon: Bot, label: "AI", activeColor: "text-cyan-300" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {isQuickAddOpen && (
        <div className="max-w-md mx-auto px-4 pb-2">
          <div className="mb-2 rounded-xl border border-slate-700 bg-slate-900/95 p-2 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/smart-input?mode=scan"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 hover:bg-slate-800"
              >
                <Camera className="w-4 h-4 text-violet-300" />
                OCR
              </Link>
              <Link
                to="/smart-input?mode=voice"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 hover:bg-slate-800"
              >
                <Mic className="w-4 h-4 text-cyan-300" />
                Voice
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="flex justify-around items-center h-16 max-w-md mx-auto px-2 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(2,6,23,0.6)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          if (item.isCenter) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => setIsQuickAddOpen((prev) => !prev)}
                className="flex flex-col items-center justify-center flex-1 h-full"
                aria-label={item.label}
              >
                <div className="h-9 w-9 rounded-md border border-slate-500 flex items-center justify-center text-slate-100 hover:bg-slate-800 transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={2.3} />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? item.activeColor : "text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => setIsQuickAddOpen(false)}
            >
              <Icon className="w-5 h-5 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
