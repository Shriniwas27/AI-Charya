import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card"; // Assuming these are from your UI library
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";
import { Subject } from "@/types/student"; // Make sure to import your defined Subject type

// --- Component Props ---
interface PerformanceChartsCardProps {
  subjects: Subject[];
  studentName: string;
}

// --- Helper Functions ---

/**
 * Calculates the average score for a subject and determines its strength.
 * This logic is consistent with the AcademicOverviewCard.
 * @param {Subject} subject - The subject object from the student's data.
 * @returns {{averageScore: number, strength: 'Strong' | 'Average' | 'Weak'}}
 */
const calculateSubjectMetrics = (subject: Subject) => {
  if (!subject.chapters || subject.chapters.length === 0) {
    return { averageScore: 0, strength: 'Weak' as const };
  }

  const chapterScores = subject.chapters.map(chapter => {
    const scores = [
      chapter.homework_score,
      chapter.test_score,
      chapter.chapter_exercise_score,
    ];
    return scores.reduce((acc, score) => acc + score, 0) / scores.length;
  });

  const totalScore = chapterScores.reduce((acc, score) => acc + score, 0);
  const averageScoreOutOf10 = totalScore / chapterScores.length;
  const averageScorePercentage = Math.round(averageScoreOutOf10 * 10);

  let strength: 'Strong' | 'Average' | 'Weak';
  if (averageScoreOutOf10 >= 8) {
    strength = 'Strong';
  } else if (averageScoreOutOf10 >= 6) {
    strength = 'Average';
  } else {
    strength = 'Weak';
  }

  return { averageScore: averageScorePercentage, strength };
};

const getScoreFillColor = (strength: string) => {
    if (strength === "Strong") return "#34A853"; // Green
    if (strength === "Average") return "#4285F4"; // Blue
    return "#FBBC05"; // Yellow/Orange for Weak
}

// --- The React Component ---

export default function PerformanceChartsCard({ subjects, studentName }: PerformanceChartsCardProps) {
  
  // Process the raw subject data to get scores and strengths for the charts.
  // useMemo ensures this calculation only runs when the subjects data changes.
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
          <h3 className="text-xl font-semibold text-gray-800">
            Performance Charts
          </h3>
        </div>

        <div className="space-y-12">
          {/* Bar Chart for Subject Scores */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Subject Scores</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#5F6368" fontSize={12} angle={-45} textAnchor="end" interval={0} />
                  <YAxis stroke="#5F6368" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    cursor={{fill: 'rgba(232, 234, 237, 0.5)'}}
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e8eaed", borderRadius: "8px" }} 
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart for Skills Overview */}
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
