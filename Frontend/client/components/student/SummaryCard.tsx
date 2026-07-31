// components/StudentProfile/SummaryCard.tsx

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SummaryCardProps {
  summary: string;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.3 }
      );
    }
  }, [summary]); // Animate when summary changes

  return (
    <Card ref={cardRef} className="bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-material-green-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-material-green" />
          </div>
          <h3 className="text-xl font-semibold text-material-gray-900">
            📝 Summary
          </h3>
        </div>
        <p className="text-material-gray-700 leading-relaxed bg-material-gray-50 p-4 rounded-lg">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
}