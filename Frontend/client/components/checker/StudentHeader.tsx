// src/components/checker/StudentHeader.js

export default function StudentHeader({ studentName, rollNumber }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-white border-2 border-gray-500 rounded-lg text-center shadow">
        <h2 className="text-xl font-bold tracking-widest text-gray-700"> HTO CHECKER</h2>
      </div>
      <div className="p-4 bg-white border-2 border-green-400 rounded-lg flex justify-between items-center shadow">
        <span className="font-semibold text-gray-800">STUDENT NAME: {studentName}</span>
        <span className="font-semibold text-gray-800">ROLL: {rollNumber}</span>
      </div>
    </div>
  );
}