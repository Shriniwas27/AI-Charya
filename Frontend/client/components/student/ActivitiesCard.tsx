// components/StudentProfile/ActivitiesCard.tsx

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

interface ActivitiesCardProps {
  activities: string[];
}

export function ActivitiesCard({ activities }: ActivitiesCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.4 }
      );
    }
  }, [activities]); // Animate when activities change

  return (
    <Card ref={cardRef} className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-material-orange-100 rounded-lg">
            <Award className="h-6 w-6 text-material-orange" />
          </div>
          <h3 className="text-xl font-semibold text-material-gray-900">
            ⚽ Activities
          </h3>
        </div>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-material-blue-50 rounded-lg border border-material-blue-100"
            >
              <div className="w-2 h-2 bg-material-blue-500 rounded-full"></div>
              <span className="text-material-gray-700 font-medium">
                {activity}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}