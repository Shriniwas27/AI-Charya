export interface AssignedClass {
  class_name: string;
  subject: string;
  section: string;
}

export interface Teacher {
  teacher_id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Female' | 'Male' | 'Other';
  qualifications: string;
  experience_years: number;
  assigned_classes: AssignedClass[];
  class_record_ids: string[];
  preferred_language: string;
}