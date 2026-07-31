import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, CheckCircle, AlertCircle } from "lucide-react";

export default function AnalysisResults({ analysis }) {
  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl">📊 Analysis Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {analysis ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Overall Score</h3>
                <div className="text-3xl font-bold text-green-600">{analysis.overall_score}%</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{analysis.total_questions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{analysis.correct_answers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{analysis.incorrect_answers}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
              </div>
            </div>

            {/* Detailed Feedback */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
              <div className="space-y-3">
                {analysis.detailed_feedback.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    {item.status === 'correct' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">Question {item.question}</div>
                      <div className="text-sm text-gray-600 mt-1">{item.feedback}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions for Improvement</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No analysis yet</p>
            <p className="text-gray-500">Upload homework using the camera to see detailed analysis and feedback</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}