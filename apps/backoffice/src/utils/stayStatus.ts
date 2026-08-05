import type { Stay, StayListItem } from "../api/stay.ts";

export type StayStatus = {
  label: string;
  color: "Green" | "Yellow" | "Red";
};

export const getStayStatus = (stay?: Stay | StayListItem | null): StayStatus => {
  const applyPeriod = stay && "stay_apply_period_stay" in stay ? stay.stay_apply_period_stay : undefined;

  if (!applyPeriod || applyPeriod.length === 0) return { label: "불러오는 중", color: "Yellow" };

  const now = new Date();
  const earliest = new Date(Math.min(...applyPeriod.map((p) => new Date(p.apply_start).getTime())));
  const latest = new Date(Math.max(...applyPeriod.map((p) => new Date(p.apply_end).getTime())));

  if (now < earliest) return { label: "신청전", color: "Red" };
  if (now <= latest) return { label: "신청중", color: "Yellow" };
  return { label: "마감", color: "Green" };
};

export const formatDateRange = (from?: string, to?: string) => {
  if (!from || !to) return "-";

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return "-";

  const dateFormat = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${dateFormat.format(fromDate)} ~ ${dateFormat.format(toDate)}`;
};

export const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
};
