import { useEffect, useMemo, useRef } from "react";
// import { gsap } from "gsap"; // Removed to fix build error
import { Card, CardContent } from "@/components/ui/card"; 
import { BookOpen } from "lucide-react";
import { Subject } from "@/types/student";

// --- Component Props ---
interface AcademicOverviewCardProps {
  subjects: Subject[];
  studentId: string; // Used to trigger animation on student change
}

// --- Helper Functions ---

/**
 * Calculates the average score for a subject and determines its strength.
 * @param {Subject} subject - The subject object from the student's data.
 * @returns {{averageScore: number, strength: 'Strong' | 'Average' | 'Weak'}}
 */
const calculateSubjectMetrics = (subject: Subject) => {
  if (!subject.chapters || subject.chapters.length === 0) {
    return { averageScore: 0, strength: 'Weak' as const };
  }

  // Calculate the average score for each chapter and then average those scores.
  const chapterScores = subject.chapters.map(chapter => {
    const scores = [
      chapter.homework_score,
      chapter.test_score,
      chapter.chapter_exercise_score,
    ];
    // Calculate average for the chapter (out of 10)
    return scores.reduce((acc, score) => acc + score, 0) / scores.length;
  });

  // Calculate the overall average score for the subject (out of 10)
  const totalScore = chapterScores.reduce((acc, score) => acc + score, 0);
  const averageScoreOutOf10 = totalScore / chapterScores.length;
  
  // Convert score to a percentage
  const averageScorePercentage = Math.round(averageScoreOutOf10 * 10);

  // Determine strength based on the score out of 10
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

const getSubjectStrengthColor = (strength: string) => {
  if (strength === "Strong") return "text-green-600";
  if (strength === "Average") return "text-blue-600";
  return "text-orange-600";
};

const getSubjectIcon = (strength: string) => {
  if (strength === "Strong") return "✅";
  if (strength === "Average") return "☑️";
  return "⚠️";
};


// --- The React Component ---

export default function AcademicOverviewCard({ subjects, studentId }: AcademicOverviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate the card whenever the studentId changes using CSS transitions
  useEffect(() => {
    const cardElement = cardRef.current;
    if (cardElement) {
      // Set initial state for the animation
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'translateY(30px)';
      // Ensure transition is set for the properties we want to animate
      cardElement.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      
      // Use a minimal timeout to allow the browser to apply the initial styles
      // before starting the transition to the final state.
      const timeoutId = setTimeout(() => {
        cardElement.style.opacity = '1';
        cardElement.style.transform = 'translateY(0px)';
      }, 50); // A small delay is needed to ensure the transition occurs

      // Cleanup function to clear timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [studentId]);

  // useMemo will re-calculate subject metrics only when the subjects array changes.
  const processedSubjects = useMemo(() => {
    return subjects.map(subject => ({
      name: subject.name,
      ...calculateSubjectMetrics(subject),
    }));
  }, [subjects]);

  return (
    <Card ref={cardRef} className="bg-white shadow-lg rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Academic Overview
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">Strength</th>
              </tr>
            </thead>
            <tbody>
              {processedSubjects.map((subject, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4 font-medium text-gray-900">{subject.name}</td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">{subject.averageScore}%</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`flex items-center gap-2 font-medium ${getSubjectStrengthColor(subject.strength)}`}>
                      <span>{getSubjectIcon(subject.strength)}</span>
                      {subject.strength}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
