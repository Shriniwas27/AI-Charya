export interface CompletionStatus {
  homework: number;
  oral: number;
  test: number;
  chapter_exercise: number;
}

export interface ChapterRecord {
  name: string;
  completion_status: CompletionStatus;
  pdf_link: string;
  template_link?: string; 
}

export interface SubjectRecord {
  name: string;
  chapters: ChapterRecord[];
}

export interface AcademicRecord {
  class_name: string;
  student_count: number;
  boys: number;
  girls: number;
  roll_numbers: number[];
  subjects: SubjectRecord[];
  teacher_ids: string[];
}