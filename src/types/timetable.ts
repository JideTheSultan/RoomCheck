export type TimetableDay = 1 | 2 | 3 | 4 | 5;

export type ScheduleDay = 0 | TimetableDay | 6;

export type TimetableTimeSlot = {
  dayOfWeek: TimetableDay;
  endMinutes: number;
  startMinutes: number;
};

export type FreeClassroom = {
  id: string;
  name: string;
};

export type ClassLevelOption = {
  level: string;
  normalizedLevel: string;
};

export type ClassGroupOption = {
  department: string;
  levels: ClassLevelOption[];
  normalizedDepartment: string;
};

export type ClassGroupScheduleEntry = {
  classroomName: string;
  courseCode: string;
  courseTitle: string | null;
  department: string;
  endMinutes: number;
  id: string;
  level: string;
  startMinutes: number;
};

export type TimetableEntry = {
  classroomId: string;
  courseCode: string;
  courseTitle: string | null;
  createdAt: string;
  dayOfWeek: TimetableDay;
  department: string;
  documentId: string;
  endMinutes: number;
  id: string;
  level: string;
  normalizedDepartment: string;
  normalizedLevel: string;
  rawValue: string | null;
  sourceLocation: string | null;
  sourceSheet: string | null;
  startMinutes: number;
};

export type DocumentTimetableEntry = TimetableEntry & {
  classroomName: string;
};

export type NewTimetableEntry = Omit<TimetableEntry, 'createdAt'> & {
  createdAt?: string;
};
