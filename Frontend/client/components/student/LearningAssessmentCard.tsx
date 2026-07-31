// components/StudentProfile/LearningAssessmentCard.tsx

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface LearningAssessmentCardProps {
  learningLevel: "Slow" | "Average" | "Advanced";
  editMode: boolean;
}

const getLearningLevelColor = (level: string) => {
  if (level === "Slow") return "bg-material-orange text-white";
  if (level === "Average") return "bg-material-blue text-white";
  return "bg-material-green text-white";
};

const getLearningInsight = (level: string) => {
  if (level === "Advanced") return "This student shows exceptional understanding and can handle challenging concepts. Consider providing additional enrichment activities.";
  if (level === "Average") return "This student is progressing well with standard curriculum. Regular practice and reinforcement will help maintain steady growth.";
  return "This student may benefit from additional support and modified teaching approaches. Consider using visual aids and hands-on activities.";
};

export function LearningAssessmentCard({ learningLevel, editMode }: LearningAssessmentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.5 }
      );
    }
  }, [learningLevel]); // Animate when level changes

  return (
    <Card ref={cardRef} className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-material-yellow-100 rounded-lg">
            <Star className="h-6 w-6 text-material-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-material-gray-900">
            Learning Assessment
          </h3>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-material-gray-700">
            Learning Level
          </label>
          {editMode ? (
            <div className="flex gap-4">
              {["Slow", "Average", "Advanced"].map((level) => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="learningLevel"
                    value={level}
                    defaultChecked={learningLevel === level}
                    className="text-material-blue focus:ring-material-blue"
                  />
                  <span className="text-material-gray-700">{level}</span>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <Badge
                className={`px-4 py-2 text-sm font-semibold ${getLearningLevelColor(
                  learningLevel,
                )}`}
              >
                {learningLevel} Learner
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-material-blue-50 rounded-lg border border-material-blue-200">
          <h4 className="font-semibold text-material-blue-800 mb-2">
            Learning Insights
          </h4>
          <p className="text-sm text-material-blue-700">
            {getLearningInsight(learningLevel)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}