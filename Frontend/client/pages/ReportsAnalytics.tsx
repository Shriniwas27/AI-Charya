import { useState } from "react";
import {
  BarChart3,
  Download,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  BookOpen,
} from "lucide-react";

interface StudentScore {
  name: string;
  scores: {
    [subject: string]: number;
  };
  weakSubjects: string[];
  overallGrade: string;
}

interface Subject {
  name: string;
  averageScore: number;
  passRate: number;
  color: string;
}

const dummyStudentData: StudentScore[] = [
  {
    name: "Ravi",
    scores: {
      Math: 70,
      Science: 45,
      EVS: 90,
      English: 65,
      Hindi: 80,
    },
    weakSubjects: ["Science"],
    overallGrade: "B",
  },
  {
    name: "Priya",
    scores: {
      Math: 95,
      Science: 88,
      EVS: 92,
      English: 90,
      Hindi: 85,
    },
    weakSubjects: [],
    overallGrade: "A+",
  },
  {
    name: "Arjun",
    scores: {
      Math: 55,
      Science: 60,
      EVS: 40,
      English: 50,
      Hindi: 65,
    },
    weakSubjects: ["Math", "EVS", "English"],
    overallGrade: "C",
  },
  {
    name: "Kavya",
    scores: {
      Math: 85,
      Science: 78,
      EVS: 88,
      English: 92,
      Hindi: 75,
    },
    weakSubjects: [],
    overallGrade: "A",
  },
  {
    name: "Amit",
    scores: {
      Math: 40,
      Science: 35,
      EVS: 55,
      English: 48,
      Hindi: 60,
    },
    weakSubjects: ["Math", "Science", "English"],
    overallGrade: "D",
  },
];

const subjectData: Subject[] = [
  { name: "Math", averageScore: 69, passRate: 75, color: "bg-material-blue" },
  {
    name: "Science",
    averageScore: 61,
    passRate: 60,
    color: "bg-material-green",
  },
  { name: "EVS", averageScore: 73, passRate: 80, color: "bg-material-orange" },
  {
    name: "English",
    averageScore: 69,
    passRate: 75,
    color: "bg-material-yellow",
  },
  { name: "Hindi", averageScore: 73, passRate: 85, color: "bg-purple-500" },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-material-green";
  if (score >= 60) return "text-material-yellow-600";
  return "text-red-600";
};

const getScoreBarColor = (score: number) => {
  if (score >= 80) return "bg-material-green";
  if (score >= 60) return "bg-material-yellow";
  return "bg-red-500";
};

const generateRecommendations = (student: StudentScore) => {
  const recommendations = [];

  if (student.weakSubjects.includes("Math")) {
    recommendations.push(
      "Implement visual learning aids for mathematical concepts",
    );
    recommendations.push(
      "Schedule extra practice sessions for basic operations",
    );
  }

  if (student.weakSubjects.includes("Science")) {
    recommendations.push("Use hands-on experiments to improve understanding");
    recommendations.push("Connect science concepts to real-world examples");
  }

  if (student.weakSubjects.includes("English")) {
    recommendations.push(
      "Increase reading activities and storytelling sessions",
    );
    recommendations.push("Focus on vocabulary building exercises");
  }

  if (student.weakSubjects.includes("EVS")) {
    recommendations.push(
      "Organize field trips to enhance environmental awareness",
    );
    recommendations.push(
      "Use local examples to explain environmental concepts",
    );
  }

  if (student.weakSubjects.length === 0) {
    recommendations.push(
      "Maintain current learning pace with advanced challenges",
    );
    recommendations.push("Consider peer tutoring opportunities");
  }

  return recommendations;
};

export default function ReportsAnalytics() {
  const [selectedStudent, setSelectedStudent] = useState<StudentScore | null>(
    null,
  );

  const exportReportCard = (student: StudentScore) => {
    // In a real app, this would generate and download a PDF
    alert(`Exporting report card for ${student.name}...`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-material-blue mr-3" />
            <h1 className="text-3xl font-bold text-material-gray-900">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-material-gray-600">
            Analyze student performance and generate detailed reports
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {/* Subject Overview */}
          <div className="material-card-elevated p-6">
            <h3 className="text-lg font-semibold text-material-gray-900 mb-4">
              Subject Performance Overview
            </h3>

            <div className="space-y-4">
              {subjectData.map((subject) => (
                <div key={subject.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-material-gray-800">
                      {subject.name}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Avg: {subject.averageScore}%
                      </div>
                      <div className="text-xs text-material-gray-600">
                        Pass: {subject.passRate}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-material-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${subject.color}`}
                      style={{ width: `${subject.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Areas Detection */}
          <div className="material-card-elevated p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-material-orange mr-2" />
              <h3 className="text-lg font-semibold text-material-gray-900">
                Detected Weak Areas
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Science</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  40% of students scoring below 60%
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-800">
                    Mathematics
                  </span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Basic operations need reinforcement
                </p>
              </div>
            </div>
          </div>

          {/* Individual Student Performance */}
          <div className="material-card-elevated p-6">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-material-blue mr-3" />
              <h2 className="text-xl font-semibold text-material-gray-900">
                📊 Individual Student Performance
              </h2>
            </div>

            <div className="space-y-4">
              {dummyStudentData.map((student) => (
                <div
                  key={student.name}
                  className="material-card p-4 cursor-pointer hover:shadow-material-md transition-shadow"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <h4 className="font-medium text-material-gray-900 mr-3">
                        {student.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.overallGrade === "A+"
                            ? "bg-material-green text-white"
                            : student.overallGrade === "A"
                              ? "bg-material-blue text-white"
                              : student.overallGrade === "B"
                                ? "bg-material-yellow text-material-gray-900"
                                : student.overallGrade === "C"
                                  ? "bg-material-orange text-white"
                                  : "bg-red-500 text-white"
                        }`}
                      >
                        Grade {student.overallGrade}
                      </span>
                    </div>
                  </div>

                  {/* Subject Progress Bars */}
                  <div className="flex items-end justify-center space-x-4 mt-4">
                    {Object.entries(student.scores).map(([subject, score]) => (
                      <div
                        key={subject}
                        className="flex flex-col items-center space-y-2"
                      >
                        <span
                          className={`text-xs font-medium ${getScoreColor(score)}`}
                        >
                          {score}%
                        </span>
                        <div className="w-8 bg-material-gray-200 rounded-full h-24 flex items-end">
                          <div
                            className={`w-8 rounded-full ${getScoreBarColor(score)}`}
                            style={{ height: `${score}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-material-gray-600 text-center">
                          {subject}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Weak Subjects Tags */}
                  {student.weakSubjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {student.weakSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs"
                        >
                          Weak: {subject}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Student Details */}
        {selectedStudent && (
          <div className="material-card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-material-green mr-3" />
                <h2 className="text-xl font-semibold text-material-gray-900">
                  Detailed Analysis: {selectedStudent.name}
                </h2>
              </div>
              <button
                onClick={() => exportReportCard(selectedStudent)}
                className="material-button-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report Card
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Chart */}
              <div>
                <h3 className="font-semibold text-material-gray-900 mb-4">
                  Subject Performance
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedStudent.scores).map(
                    ([subject, score]) => (
                      <div key={subject} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-material-gray-700">
                            {subject}
                          </span>
                          <span
                            className={`font-semibold ${getScoreColor(score)}`}
                          >
                            {score}%
                          </span>
                        </div>
                        <div className="w-full bg-material-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getScoreBarColor(score)}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-material-blue mr-2" />
                  <h3 className="font-semibold text-material-gray-900">
                    AI-Generated Recommendations
                  </h3>
                </div>
                <div className="space-y-3">
                  {generateRecommendations(selectedStudent).map(
                    (recommendation, index) => (
                      <div
                        key={index}
                        className="bg-material-blue-50 p-3 rounded-lg"
                      >
                        <div className="flex items-start">
                          <BookOpen className="h-4 w-4 text-material-blue mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-material-blue-800">
                            {recommendation}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
