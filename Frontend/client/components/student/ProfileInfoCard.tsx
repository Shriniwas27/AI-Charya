import { useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card"; // Assuming from your UI library
import {
  BarChart3,
  User,
  Calendar,
  Globe,
  Edit,
  Save,
  BookOpen,
  Star,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";
import { Student, Subject } from "@/types/student"; // Assuming types are in './types'

// --- Type Definitions (for context, assuming these are in './types.ts') ---
/*
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

export interface Student {
  student_id: string;
  name: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  student_class: string;
  mother_tongue: string;
  // ... other student properties
  academic: Academic;
}
*/


// --- Helper Functions ---

/**
 * Calculates the average score and strength for a single subject.
 */
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

const getScoreFillColor = (strength: string) => {
  if (strength === "Strong") return "#34A853"; // Green
  if (strength === "Average") return "#4285F4"; // Blue
  return "#FBBC05"; // Yellow/Orange for Weak
};


// --- PerformanceChartsCard Component ---

interface PerformanceChartsCardProps {
  subjects: Subject[];
  studentName: string;
}

export function PerformanceChartsCard({ subjects, studentName }: PerformanceChartsCardProps) {
  const chartData = useMemo(() => {
    return subjects.map(subject => {
      const { averageScore, strength } = calculateSubjectMetrics(subject);
      return {
        name: subject.name,
        score: averageScore,
        strength: strength,
        fill: getScoreFillColor(strength),
      };
    });
  }, [subjects]);

  return (
    <Card className="bg-white shadow-lg rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Performance Charts</h3>
        </div>
        <div className="space-y-12">
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Subject Scores</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#5F6368" fontSize={12} angle={-45} textAnchor="end" interval={0} />
                  <YAxis stroke="#5F6368" fontSize={12} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(232, 234, 237, 0.5)' }} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e8eaed", borderRadius: "8px" }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Skills Radar</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 13, fill: "#5F6368" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9aa0a6" }} />
                  <Radar name={studentName} dataKey="score" stroke="#4285F4" fill="#4285F4" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e8eaed", borderRadius: "8px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


// --- ProfileInfoCard Component ---

interface ProfileInfoCardProps {
  student: Student;
  editMode: boolean;
  onEditToggle: () => void;
}

const getLearningLevelColor = (level: string) => {
  switch (level) {
    case "Advanced": return "bg-green-500 text-white";
    case "Average": return "bg-blue-500 text-white";
    case "Slow": return "bg-orange-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

export function ProfileInfoCard({ student, editMode, onEditToggle }: ProfileInfoCardProps) {
  const profileCardRef = useRef<HTMLDivElement>(null);

  // Calculate overall student metrics
  const studentMetrics = useMemo(() => {
    const subjects = student.academic.subjects;
    if (!subjects || subjects.length === 0) {
      return { learningLevel: 'Slow', bestSubject: 'N/A', needsFocusOn: [] };
    }
    
    const subjectDetails = subjects.map(s => ({ name: s.name, ...calculateSubjectMetrics(s) }));
    
    const totalAverage = subjectDetails.reduce((acc, s) => acc + s.averageScore, 0) / subjectDetails.length;
    
    let learningLevel: 'Advanced' | 'Average' | 'Slow';
    if (totalAverage >= 80) learningLevel = 'Advanced';
    else if (totalAverage >= 60) learningLevel = 'Average';
    else learningLevel = 'Slow';

    const bestSubject = subjectDetails.sort((a, b) => b.averageScore - a.averageScore)[0]?.name || 'N/A';
    const needsFocusOn = subjectDetails.filter(s => s.strength === 'Weak').map(s => s.name);

    return { learningLevel, bestSubject, needsFocusOn };
  }, [student]);

  // Animation using CSS transitions instead of GSAP/Framer Motion
  useEffect(() => {
    const cardElement = profileCardRef.current;
    if (cardElement) {
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'translateY(30px)';
        cardElement.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        const timeoutId = setTimeout(() => {
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'translateY(0px)';
        }, 50);
        return () => clearTimeout(timeoutId);
    }
  }, [student.student_id]);

  return (
    <Card ref={profileCardRef} className="bg-white shadow-lg sticky top-8 rounded-xl">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <img
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.name}`}
            alt={student.name}
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-200 shadow-lg"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-600"><Calendar className="h-4 w-4" /><span>Age: {student.age} years</span></div>
            <div className="flex items-center justify-center gap-2 text-gray-600"><User className="h-4 w-4" /><span>{student.gender}</span></div>
            <div className="flex items-center justify-center gap-2 text-gray-600"><BookOpen className="h-4 w-4" /><span>{student.student_class}</span></div>
            <div className="flex items-center justify-center gap-2 text-gray-600"><Globe className="h-4 w-4" /><span>{student.mother_tongue}</span></div>
          </div>
          <div className="pt-4">
            <div className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${getLearningLevelColor(studentMetrics.learningLevel)}`}>
              <Star className="h-4 w-4 mr-1" />{studentMetrics.learningLevel} Learner
            </div>
          </div>
          <div className="pt-4 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-1 flex items-center justify-center gap-2"><Trophy className="h-5 w-5" />Best Subject</h4>
            <p className="text-green-700 font-medium">{studentMetrics.bestSubject}</p>
          </div>
          {studentMetrics.needsFocusOn.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center justify-center gap-2"><AlertTriangle className="h-5 w-5" />Needs Focus On</h4>
              <div className="space-y-1">
                {studentMetrics.needsFocusOn.map((subject, index) => <p key={index} className="text-orange-700 text-sm">{subject}</p>)}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex gap-3 justify-center">
          <button onClick={onEditToggle} className="flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95">
            <Edit className="h-4 w-4 mr-2" />
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
          {editMode && (
            <button onClick={() => onEditToggle()} className="flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
