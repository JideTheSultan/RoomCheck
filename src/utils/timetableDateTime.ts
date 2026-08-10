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
