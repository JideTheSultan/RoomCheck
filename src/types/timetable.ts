export type TimetableDay = 1 | 2 | 3 | 4 | 5;

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

export type NewTimetableEntry = Omit<TimetableEntry, 'createdAt'> & {
  createdAt?: string;
};
