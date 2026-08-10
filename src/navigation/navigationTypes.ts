import type { ScheduleDay } from '../types';

type BaseSearchParams = {
  dayOfWeek: ScheduleDay;
  endMinutes: number;
  searchMode: 'now' | 'selected';
  startMinutes: number;
  title: string;
};

export type FreeClassroomSearchParams = BaseSearchParams & {
  kind: 'free-classrooms';
};

export type ClassGroupSearchParams = BaseSearchParams & {
  department: string;
  kind: 'class-group';
  level: string;
  normalizedDepartment: string;
  normalizedLevel: string;
};

export type RootStackParamList = {
  About: undefined;
  Home: undefined;
  ImportTimetables: undefined;
  FindFreeClassroom: undefined;
  CheckDepartmentLevel: undefined;
  DataBackup: undefined;
  ImageTimetableEntry: {
    documentId: string;
    documentName: string;
  };
  ManageDocuments: undefined;
  SearchResults: FreeClassroomSearchParams | ClassGroupSearchParams;
};
