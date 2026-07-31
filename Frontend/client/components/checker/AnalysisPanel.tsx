// src/components/checker/AnalysisPanel.tsx

import { FileClock, CheckSquare, XSquare } from "lucide-react";

export default function AnalysisPanel({
  appStep,
  analysis,
  capturedHomeworkImage,
  onReset
}) {

  // Show a spinner while the homework is being analyzed
  if (appStep === 'ANALYZING') {
    return (
      <div className="p-4 bg-white border-2 border-gray-300 rounded-lg shadow-md flex-grow flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-600 mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">Analyzing Homework...</p>
      </div>
    );
  }

  // Show the final results
  if (appStep === 'DONE' && analysis) {
    return (
      <div className="p-4 bg-white border-2 border-yellow-400 rounded-lg shadow-md flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-700 mb-4">Analysis Results</h3>
            <div className="space-y-2 text-gray-800">
              <p className="flex items-center gap-2"><CheckSquare className="text-green-600"/> Q1. {analysis.q1.text} {analysis.q1.marks} Marks</p>
              <p className="flex items-center gap-2"><XSquare className="text-red-600"/> Q2. {analysis.q2.text} {analysis.q2.marks} Marks</p>
              <p className="flex items-center gap-2"><CheckSquare className="text-green-600"/> Q3. {analysis.q3.text} {analysis.q3.marks} Marks</p>
              <p className="flex items-center gap-2"><XSquare className="text-red-600"/> Q4. {analysis.q4.text} {analysis.q4.marks} Marks</p>
              <hr className="my-2"/>
              <p className="font-bold text-xl">TOTAL: {analysis.total}/{analysis.max}</p>
            </div>
            <button onClick={onReset} className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Check Another
            </button>
          </div>
          {capturedHomeworkImage && (
            <div className="ml-4 text-center">
              <p className="font-bold text-sm mb-1">Submitted Page</p>
              <img src={capturedHomeworkImage} alt="Captured homework" className="w-48 h-auto rounded-lg shadow-lg border"/>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default placeholder view
  return (
    <div className="p-4 bg-white border-2 border-gray-300 rounded-lg shadow-md flex-grow flex items-center justify-center min-h-[300px]">
      <div className="text-center text-gray-500">
        <FileClock className="h-12 w-12 mx-auto mb-2" />
        <p className="text-xl font-semibold">Awaiting Submission...</p>
        <p>Results will be displayed here after homework is scanned.</p>
      </div>
    </div>
  );
}