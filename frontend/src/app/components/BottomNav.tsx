import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
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
import { useLocale } from "../lib/locale";

interface BottomNavProps {
  currentPath: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const { t } = useLocale();

  const navItems = [
    { path: "/", icon: Home, label: t("bottom.overview"), activeColor: "text-emerald-300" },
    { path: "/budget", icon: PieChart, label: t("bottom.budget"), activeColor: "text-emerald-300" },
    { path: "/reports", icon: BarChart3, label: t("bottom.reports"), activeColor: "text-emerald-300" },
    { path: "/ai-advisor", icon: Bot, label: t("bottom.ai"), activeColor: "text-emerald-300" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2">
      <div
        className="pointer-events-none absolute inset-x-2 bottom-2 mx-auto max-w-md rounded-[2rem] border border-foreground/10 bg-foreground/[0.015]"
        style={{
          height: "calc(66px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      />
      <nav
        className="relative z-10 flex justify-around items-center max-w-md mx-auto px-2 rounded-[2rem] border border-foreground/15 bg-foreground/[0.04] backdrop-blur-md backdrop-saturate-125 shadow-[0_6px_16px_rgba(2,6,23,0.08)]"
        style={{
          height: "calc(66px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-foreground/10 via-foreground/[0.03] to-transparent" />
        <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-foreground/[0.06]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-foreground/15" />

        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative z-10 flex flex-col items-center justify-center flex-1 h-[54px] mx-1 my-1 rounded-[1.35rem] touch-manipulation transition-colors duration-200 ease-out active:scale-[0.96] motion-reduce:active:scale-100 ${
                isActive
                  ? "text-foreground"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-foreground/10 border border-foreground/20 rounded-[1.35rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] mb-1" strokeWidth={2} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <DropdownMenu modal={false} onOpenChange={setIsQuickMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`relative z-10 flex flex-col items-center justify-center flex-1 h-[54px] mx-1 my-1 rounded-[1.35rem] group touch-manipulation transition-all duration-200 ease-out active:scale-[0.96] motion-reduce:active:scale-100 ${
                isQuickMenuOpen ? "" : "hover:bg-foreground/5"
              }`}
              aria-label="Thêm nhanh"
            >
              {isQuickMenuOpen && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-foreground/10 border border-foreground/20 rounded-[1.35rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div
                className={`-mt-6 h-14 w-14 rounded-[1rem] border-2 flex items-center justify-center text-white transition-all duration-200 ${
                  isQuickMenuOpen
                    ? "border-emerald-200 bg-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.52)] ring-2 ring-emerald-200/45 scale-95"
                    : "border-emerald-300/95 bg-emerald-500 shadow-[0_0_18px_rgba(34,197,94,0.42)] hover:bg-emerald-400 hover:scale-105"
                }`}
              >
                <Plus
                  className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isQuickMenuOpen ? "rotate-45" : "rotate-0"}`}
                  strokeWidth={2.2}
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={10}
            className="w-60 border border-border bg-popover/95 text-popover-foreground backdrop-blur-md backdrop-saturate-120 p-2 rounded-2xl shadow-[0_6px_16px_rgba(2,6,23,0.12)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-4 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-emerald-500/25 bg-foreground/[0.03] px-3 py-2.5 mb-2 transition-transform active:scale-95">
              <Link to="/smart-input?mode=voice" className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Giọng nói</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-emerald-500/25 bg-foreground/[0.03] px-3 py-2.5 mb-2 transition-transform active:scale-95">
              <Link to="/smart-input?mode=manual" className="flex items-center gap-3">
                <Keyboard className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Nhập thủ công</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg border border-emerald-500/25 bg-foreground/[0.03] px-3 py-2.5 transition-transform active:scale-95">
              <Link to="/smart-input?mode=scan" className="flex items-center gap-3">
                <ScanLine className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">OCR / Quét hóa đơn</span>
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
              className={`relative z-10 flex flex-col items-center justify-center flex-1 h-[54px] mx-1 my-1 rounded-[1.35rem] touch-manipulation transition-colors duration-200 ease-out active:scale-[0.96] motion-reduce:active:scale-100 ${
                isActive
                  ? "text-foreground"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-foreground/10 border border-foreground/20 rounded-[1.35rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] mb-1" strokeWidth={2} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
