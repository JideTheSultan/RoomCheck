export type ClassroomOrigin = 'discovered' | 'manual';

export type Classroom = {
  createdAt: string;
  id: string;
  isActive: boolean;
  name: string;
  normalizedName: string;
  origin: ClassroomOrigin;
  updatedAt: string;
};

export type ClassroomAlias = {
  alias: string;
  classroomId: string;
  createdAt: string;
  id: string;
  normalizedAlias: string;
};

export type NewClassroom = {
  id: string;
  name: string;
  origin: ClassroomOrigin;
};
