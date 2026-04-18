import { apiRequest } from "./client";
import type { ApiTransaction } from "./transactions";

export interface CalendarMonthDay {
  date: string;
  income_minor: number;
  expense_minor: number;
  net_minor: number;
  transaction_count: number;
}

export interface CalendarMonthSummary {
  income_minor: number;
  expense_minor: number;
  net_minor: number;
}

export interface CalendarMonthResponse {
  month: string;
  summary: CalendarMonthSummary;
  days: CalendarMonthDay[];
}

export interface CalendarDayResponse {
  date: string;
  summary: CalendarMonthSummary & {
    transaction_count: number;
  };
  items: ApiTransaction[];
}

export function getCalendarMonth(month: string) {
  return apiRequest<CalendarMonthResponse>("/calendar/month", {
    method: "GET",
    params: { month },
  });
}

export function getCalendarDay(date: string) {
  return apiRequest<CalendarDayResponse>("/calendar/day", {
    method: "GET",
    params: { date },
  });
}