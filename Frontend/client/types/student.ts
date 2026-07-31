export interface Chapter {
  name: string;
  homework_score: number;
  test_score: number;
  chapter_exercise_score: number;
  remarks: string;
}

export interface Subject {
  name: string;
  chapters: Chapter[];
}

export interface Academic {
  subjects: Subject[];
}

export interface ParentDetails {
  name: string;
  phone: string;
  occupation: string;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relation: string;
}

export interface HealthInfo {
    allergies: string;
    medicalNotes: string;
}

export interface Student {
  roll_no: string;
  name: string;
  profilePhoto: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  student_class: string;
  blood_group: string;
  address: string;
  aadhar_number: string;
  preferred_language: string;
  mother_tongue: string;
  fatherDetails: ParentDetails;
  motherDetails: ParentDetails;
  emergencyContact: EmergencyContact;
  healthInfo: HealthInfo;
  hobbies: string[];
  academic_achievements: string;
  academic: Academic;
}