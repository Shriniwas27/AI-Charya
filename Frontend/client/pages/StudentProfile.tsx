import { useState, useMemo, useEffect } from "react";
import { Button } from "../components/ui/button";
import { UserPlus } from "lucide-react";

// Import the TypeScript types
import { Student, Subject, Academic } from "../types/student"; 

// Import your page components from their respective files
import { StudentForm } from "../components/student/StudentForm";
import { ProfileInfoCard } from "../components/student/ProfileInfoCard";
import AcademicOverviewCard from "../components/student/AcademicOverviewCard";
import PerformanceChartsCard from "../components/student/PerformanceChartsCard";
import { SummaryCard } from "../components/student/SummaryCard";
import { ActivitiesCard } from "../components/student/ActivitiesCard";
import { LearningAssessmentCard } from "../components/student/LearningAssessmentCard";
import axios from "axios";

// --- Dummy Data ---
const initialStudents: Student[] = [
    {
        roll_no: 'S12345',
        name: 'Rahul Sharma',
        profilePhoto: 'https://i.pravatar.cc/150?img=1',
        age: 14,
        dob: '2008-07-10',
        gender: 'Male',
        student_class: '8th Grade',
        blood_group: 'B+',
        address: '123 MG Road, Pune, Maharashtra, 411001',
        aadhar_number: '1234 5678 9012',
        preferred_language: 'English',
        mother_tongue: 'Marathi',
        fatherDetails: { name: 'Rajesh Sharma', phone: '9123456789', occupation: 'Engineer' },
        motherDetails: { name: 'Sunita Sharma', phone: '9876543210', occupation: 'Teacher' },
        emergencyContact: { name: 'Rajesh Sharma', phone: '9123456789', relation: 'Father' },
        healthInfo: { allergies: 'None', medicalNotes: 'None' },
        hobbies: ['Reading', 'Chess', 'Football'],
        academic_achievements: 'Won National Science Olympiad in 2023. Consistently scores high in Mathematics.',
        academic: {
            subjects: [
                {
                    name: 'Mathematics',
                    chapters: [
                        { name: 'Algebra', homework_score: 9, test_score: 8, chapter_exercise_score: 10, remarks: 'Excellent progress' },
                        { name: 'Geometry', homework_score: 7, test_score: 7, chapter_exercise_score: 8, remarks: 'Good understanding' }
                    ]
                },
                {
                    name: 'Science',
                    chapters: [
                        { name: 'Light and Sound', homework_score: 8, test_score: 9, chapter_exercise_score: 9, remarks: 'Very curious learner' }
                    ]
                },
                {
                    name: 'History',
                    chapters: [
                        { name: 'Ancient Civilizations', homework_score: 6, test_score: 5, chapter_exercise_score: 7, remarks: 'Needs more focus on dates.' }
                    ]
                }
            ]
        }
    }
];

// Helper function to transform API data to match your component structure
const transformApiDataToStudent = (apiData: any): Student => {
    return {
        roll_no: apiData.roll_no || '',
        name: apiData.name || '',
        profilePhoto: apiData.profilePhoto || `https://api.dicebear.com/8.x/initials/svg?seed=${apiData.name}`,
        age: apiData.age || 0,
        dob: apiData.dob || '',
        gender: apiData.gender || '',
        student_class: apiData.student_class || '',
        blood_group: apiData.blood_group || '',
        address: apiData.address || '',
        aadhar_number: apiData.aadhar_number || '',
        preferred_language: apiData.preferred_language || '',
        mother_tongue: apiData.mother_tongue || '',
        fatherDetails: apiData.fatherDetails || { name: '', phone: '', occupation: '' },
        motherDetails: apiData.motherDetails || { name: '', phone: '', occupation: '' },
        emergencyContact: apiData.emergencyContact || { name: '', phone: '', relation: '' },
        healthInfo: apiData.healthInfo || { allergies: '', medicalNotes: '' },
        hobbies: apiData.hobbies || [],
        academic_achievements: apiData.academic_achievements || '',
        academic: apiData.academic || { subjects: [] }
    };
};

// Helper function to calculate subject metrics
const calculateSubjectMetrics = (subject: Subject) => {
  if (!subject.chapters || subject.chapters.length === 0) {
    return { averageScore: 0, strength: 'Weak' as const };
  }
  const chapterScores = subject.chapters.map(chapter => {
    const scores = [chapter.homework_score, chapter.test_score, chapter.chapter_exercise_score];
    return scores.reduce((acc, score) => acc + score, 0) / scores.length;
  });
  const totalScore = chapterScores.reduce((acc, score) => acc + score, 0);
  const averageScoreOutOf10 = totalScore / chapterScores.length;
  const averageScorePercentage = Math.round(averageScoreOutOf10 * 10);
  
  let strength: 'Strong' | 'Average' | 'Weak';
  if (averageScoreOutOf10 >= 8) strength = 'Strong';
  else if (averageScoreOutOf10 >= 6) strength = 'Average';
  else strength = 'Weak';

  return { averageScore: averageScorePercentage, strength };
};

export default function StudentProfile() {
  // Initialize with dummy data to prevent blank page
  const [students, setStudents] = useState<Student[]>(initialStudents); 
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(initialStudents[0]);
  const [editMode, setEditMode] = useState(false);
  const [view, setView] = useState<'profile' | 'form'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null); // To store raw API response

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make GET request using axios - Updated URL
      const response = await axios.get('https://cf02a2aac7b6.ngrok-free.app/students/', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });
      
      const data = response.data;
      console.log('API Response:', data); // Display in console as requested
      setApiResponse(data); // Store raw response
      
      // Transform the API data to match your component structure
      const transformedStudents = Array.isArray(data) 
        ? data.map(transformApiDataToStudent)
        : [transformApiDataToStudent(data)];
      
      setStudents(transformedStudents);
      if (transformedStudents.length > 0) {
        setSelectedStudent(transformedStudents[0]);
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error("Failed to fetch students:", err);
      // Keep the dummy data on error instead of setting empty array
      console.log("Using fallback dummy data");
    } finally {
      setLoading(false);
    }
  };

  // API call on component mount
  useEffect(() => {
    fetchStudents();
  }, []);
  
  const handleSaveStudent = (newStudentData: Student) => {
    const newStudentWithTempId = {
      ...newStudentData,
      student_id: `temp_${Date.now()}`, 
    };
    setStudents(prevStudents => [...prevStudents, newStudentWithTempId]);
    setSelectedStudent(newStudentWithTempId);
    setView('profile');
  };
  
  // Calculate learning level for the selected student
  const studentMetrics = useMemo((): { learningLevel: "Average" | "Advanced" | "Slow" } => {
    if (!selectedStudent || !selectedStudent.academic || !selectedStudent.academic.subjects) {
      return { learningLevel: 'Average' as const };
    }
    
    const subjects = selectedStudent.academic.subjects;
    if (subjects.length === 0) {
      return { learningLevel: 'Average' as const };
    }
    
    const subjectDetails = subjects.map(s => calculateSubjectMetrics(s));
    const totalAverage = subjectDetails.reduce((acc, s) => acc + s.averageScore, 0) / subjectDetails.length;
    
    let learningLevel: "Advanced" | "Average" | "Slow";
    if (totalAverage >= 80) learningLevel = 'Advanced';
    else if (totalAverage >= 60) learningLevel = 'Average';
    else learningLevel = 'Slow';

    return { learningLevel };
  }, [selectedStudent]);

  if (view === 'form') {
    return (
      <StudentForm 
        onSave={handleSaveStudent} 
        onCancel={() => setView('profile')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <div className="px-8 lg:px-12 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🎓 Student Dashboard</h1>
          <p className="text-lg text-gray-600">View and manage student profiles</p>
        </div>
      </div>

      <div className="w-full bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 lg:px-12 py-6 flex flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3 overflow-clip ">
            {students.map((student) => (
              <Button
                key={student.roll_no}
                onClick={() => setSelectedStudent(student)}
                variant={selectedStudent?.roll_no === student.roll_no ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <img
                  src={student.profilePhoto || `https://api.dicebear.com/8.x/initials/svg?seed=${student.name}`}
                  alt={student.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                {student.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={fetchStudents} variant="outline">
              Refresh Data
            </Button>
            <Button onClick={() => setView('form')} className="bg-[#34A853] hover:bg-[#1E8E3E] text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg">Loading students...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                <h3 className="text-red-800 font-semibold">Error loading data</h3>
                <p className="text-red-600">{error}</p>
                <p className="text-sm text-red-500 mt-2">Showing demo data instead</p>
                <Button onClick={fetchStudents} className="mt-3">
                  Retry API Call
                </Button>
              </div>
            </div>
          ) : selectedStudent ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <ProfileInfoCard
                  student={selectedStudent}
                  editMode={editMode}
                  onEditToggle={() => setEditMode(!editMode)}
                />
              </div>
              <div className="lg:col-span-8 space-y-6">
                {selectedStudent.academic && selectedStudent.academic.subjects && selectedStudent.academic.subjects.length > 0 ? (
                  <>
                    <AcademicOverviewCard
                      subjects={selectedStudent.academic.subjects}
                      studentId={selectedStudent.roll_no}
                    />
                    <PerformanceChartsCard
                      subjects={selectedStudent.academic.subjects}
                      studentName={selectedStudent.name}
                    />
                    <SummaryCard summary={selectedStudent.academic_achievements} />
                    <ActivitiesCard activities={selectedStudent.hobbies} />
                    <LearningAssessmentCard
                      learningLevel={studentMetrics.learningLevel}
                      editMode={editMode}
                    />
                  </>
                ) : (
                  <div className="text-center py-10 bg-gray-100 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-700">No Academic Data</h2>
                    <p className="text-gray-500">This student does not have any academic records to display.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold text-gray-600">No Students Found</h2>
              <p className="text-gray-500">Please add a student to view their profile.</p>
              <Button onClick={fetchStudents} className="mt-4">
                Retry Loading
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
