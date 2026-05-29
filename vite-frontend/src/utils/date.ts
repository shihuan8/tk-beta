export interface CalendarDateLike {
  day: number;
  month: number;
  year: number;
}

export interface DatePreset {
  label: string;
  offsetDays?: number;
  value?: number;
}

export function timestampToCalendarDate(timestamp: number | null | undefined): CalendarDateLike | null {
  if (!timestamp || timestamp <= 0) return null;
  const date = new Date(timestamp);

  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function calendarDateToTimestamp(date: CalendarDateLike | null | undefined, endOfDay = true): number | null {
  if (!date) return null;
  if (endOfDay) return new Date(date.year, date.month - 1, date.day, 23, 59, 59).getTime();

  return new Date(date.year, date.month - 1, date.day).getTime();
}

export function calculateDateFromPreset(preset: DatePreset): number {
  if (preset.value !== undefined) return preset.value;
  if (preset.offsetDays !== undefined) {
    const date = new Date();

    date.setDate(date.getDate() + preset.offsetDays);
    date.setHours(23, 59, 59, 999);

    return date.getTime();
  }

  return 0;
}
