import {
  format,
  formatDistanceToNow,
  parseISO,
  isBefore,
  differenceInDays,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { arEG } from "date-fns/locale";

export function formatBranchDate(isoString: string | undefined): string {
  if (!isoString) return "-";
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "اليوم";
    if (isTomorrow(date)) return "غداً";
    if (isYesterday(date)) return "أمس";
    return format(date, "d MMMM yyyy", { locale: arEG });
  } catch {
    return "-";
  }
}

export function formatBranchDateTime(isoString: string | undefined): string {
  if (!isoString) return "-";
  try {
    const date = parseISO(isoString);
    const dayLabel = isToday(date)
      ? "اليوم"
      : isTomorrow(date)
      ? "غداً"
      : isYesterday(date)
      ? "أمس"
      : format(date, "d MMMM", { locale: arEG });
    const timeLabel = format(date, "hh:mm a", { locale: arEG });
    return `${dayLabel} — ${timeLabel}`;
  } catch {
    return "-";
  }
}

export function formatBranchTime(isoString: string | undefined): string {
  if (!isoString) return "-";
  try {
    return format(parseISO(isoString), "hh:mm a", { locale: arEG });
  } catch {
    return "-";
  }
}

export function formatBranchRelative(isoString: string | undefined): string {
  if (!isoString) return "-";
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "اليوم";
    if (isYesterday(date)) return "أمس";
    return formatDistanceToNow(date, { addSuffix: true, locale: arEG });
  } catch {
    return "-";
  }
}

export function isOverdue(isoString: string | undefined): boolean {
  if (!isoString) return false;
  try {
    return isBefore(parseISO(isoString), new Date());
  } catch {
    return false;
  }
}

export function getDaysInStage(stageUpdatedAt: string | undefined): number {
  if (!stageUpdatedAt) return 0;
  try {
    return Math.max(0, differenceInDays(new Date(), parseISO(stageUpdatedAt)));
  } catch {
    return 0;
  }
}

export function isCustomerStale(
  lastContactAt: string | undefined,
  isVip = false
): boolean {
  if (!lastContactAt) return true;
  try {
    const days = differenceInDays(new Date(), parseISO(lastContactAt));
    return isVip ? days > 7 : days > 14;
  } catch {
    return false;
  }
}

export function getDaysSinceContact(
  lastContactAt: string | undefined
): number {
  if (!lastContactAt) return 999;
  try {
    return Math.max(0, differenceInDays(new Date(), parseISO(lastContactAt)));
  } catch {
    return 0;
  }
}

export function getTomorrowMorningIso(hour = 11, minute = 0): string {
  const tomorrow = addDays(new Date(), 1);
  const scheduled = setSeconds(setMinutes(setHours(tomorrow, hour), minute), 0);
  return scheduled.toISOString();
}
