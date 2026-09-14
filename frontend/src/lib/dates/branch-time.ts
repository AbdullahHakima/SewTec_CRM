import {
  formatDistanceToNow,
  parseISO,
  isBefore,
  differenceInDays,
  isToday,
  isYesterday,
} from "date-fns";
import { arEG } from "date-fns/locale";

export function formatBranchDate(iso: string | undefined): string {
  if (!iso) return "-";
  try {
    if (branchDay(iso) === branchDay()) return "اليوم";
    return new Intl.DateTimeFormat("ar-EG", {timeZone:"Africa/Cairo",day:"numeric",month:"long",year:"numeric"}).format(new Date(iso));
  } catch { return "-"; }
}
export function formatBranchTime(iso: string | undefined): string {
  if (!iso) return "-";
  try { return new Intl.DateTimeFormat("ar-EG", {timeZone:"Africa/Cairo",hour:"2-digit",minute:"2-digit"}).format(new Date(iso)); } catch { return "-"; }
}
export function formatBranchDateTime(iso: string | undefined): string {
  return iso ? `${formatBranchDate(iso)} — ${formatBranchTime(iso)}` : "-";
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
    return isVip ? days >= 14 : days >= 21;
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

export function branchDay(iso = new Date().toISOString()): string {
  return new Intl.DateTimeFormat("en-CA", {timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date(iso));
}
export function branchDateTimeToIso(day: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("أدخل تاريخاً ووقتاً صالحين.");
  const target = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(target)) throw new Error("التاريخ غير صالح.");
  let value = target;
  const formatter = new Intl.DateTimeFormat("en-CA", {timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"});
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(formatter.formatToParts(value).map(part => [part.type,part.value]));
    const represented = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    if (represented === target) return new Date(value).toISOString();
    value += target - represented;
  }
  throw new Error("هذا الوقت غير متاح بسبب تغيير التوقيت الصيفي. اختر وقتاً آخر.");
}
export function getTomorrowMorningIso(hour = 11, minute = 0): string {
  const day = new Date(`${branchDay()}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + 1);
  return branchDateTimeToIso(day.toISOString().slice(0,10), `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
}
