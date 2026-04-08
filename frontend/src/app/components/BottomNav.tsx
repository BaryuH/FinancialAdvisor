import React, { useState } from "react";
import { Link } from "react-router";
import {
  Home,
  PieChart,
  Bot,
  BarChart3,
  Plus,
  Mic,
  ScanLine,
  Keyboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface BottomNavProps {
  currentPath: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Tổng quan", activeColor: "text-emerald-300" },
    { path: "/budget", icon: PieChart, label: "Ngân sách", activeColor: "text-orange-300" },
    { path: "/reports", icon: BarChart3, label: "Báo cáo", activeColor: "text-violet-300" },
    { path: "/ai-advisor", icon: Bot, label: "AI", activeColor: "text-cyan-300" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="flex justify-around items-center h-14 max-w-md mx-auto px-2 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(2,6,23,0.6)]">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? item.activeColor : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}

        <DropdownMenu modal={false} onOpenChange={setIsQuickMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center flex-1 h-full group"
              aria-label="Thêm nhanh"
            >
              <div
                className={`h-9 w-9 rounded-lg border-2 flex items-center justify-center text-slate-950 shadow-lg transition-all duration-200 ${
                  isQuickMenuOpen
                    ? "border-cyan-300 bg-cyan-300 shadow-cyan-400/30 ring-2 ring-cyan-300/40"
                    : "border-cyan-400/80 bg-cyan-500 shadow-cyan-500/20 hover:bg-cyan-400"
                }`}
              >
                <Plus
                  className={`w-4 h-4 transition-transform duration-200 ${isQuickMenuOpen ? "rotate-45" : "rotate-0"}`}
                  strokeWidth={2.5}
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={10}
            className="w-60 border-slate-700 bg-slate-950/95 text-slate-100 backdrop-blur-xl p-2 rounded-xl"
          >
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-cyan-500/20 bg-slate-900/80 px-3 py-2.5 mb-2">
              <Link to="/smart-input?mode=voice" className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-cyan-300" />
                <span className="text-sm">Giọng nói</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-emerald-500/20 bg-slate-900/80 px-3 py-2.5 mb-2">
              <Link to="/transactions?add=1" className="flex items-center gap-3">
                <Keyboard className="h-4 w-4 text-emerald-300" />
                <span className="text-sm">Nhập thủ công</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-violet-500/20 bg-slate-900/80 px-3 py-2.5">
              <Link to="/smart-input?mode=scan" className="flex items-center gap-3">
                <ScanLine className="h-4 w-4 text-violet-300" />
                <span className="text-sm">OCR / Quét hóa đơn</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? item.activeColor : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
