import type { ScheduleDay } from '../types';

const dayLabels: Record<ScheduleDay, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const timetableWeekdays = [
  { day: 1, shortLabel: 'Mon' },
  { day: 2, shortLabel: 'Tue' },
  { day: 3, shortLabel: 'Wed' },
  { day: 4, shortLabel: 'Thu' },
  { day: 5, shortLabel: 'Fri' },
] as const;

export function getDayLabel(day: ScheduleDay) {
  return dayLabels[day];
}

export function formatMinutes(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(1440, minutes));
  const hour24 = Math.floor(safeMinutes / 60) % 24;
  const minute = safeMinutes % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute.toString().padStart(2, '0')} ${meridiem}`;
}

export function formatTimeRange(startMinutes: number, endMinutes: number) {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`;
}

export function parseTimetableTimeInput(value: string) {
  const normalized = value.trim().toUpperCase().replace(/[.\s]/g, '');

  if (!normalized) {
    return null;
  }

  const meridiemMatch = normalized.match(/(AM|PM)$/);
  const meridiem = meridiemMatch?.[1] ?? null;
  const timeValue = meridiem
    ? normalized.slice(0, -meridiem.length)
    : normalized;
  let hour: number;
  let minute: number;

  if (timeValue.includes(':')) {
    const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
      return null;
    }

    hour = Number(match[1]);
    minute = Number(match[2]);
  } else if (/^\d{3,4}$/.test(timeValue)) {
    hour = Number(timeValue.slice(0, -2));
    minute = Number(timeValue.slice(-2));
  } else if (/^\d{1,2}$/.test(timeValue)) {
    hour = Number(timeValue);
    minute = 0;
  } else {
    return null;
  }

  if (minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    return (hour % 12) * 60 + minute + (meridiem === 'PM' ? 720 : 0);
  }

  if (hour === 24 && minute === 0) {
    return 1440;
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

export function getCurrentSchedulePeriod(now = new Date()) {
  const dayOfWeek = now.getDay() as ScheduleDay;
  const startMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = Math.min(1440, startMinutes + 60);

  return {
    dayOfWeek,
    endMinutes,
    startMinutes,
  };
}
