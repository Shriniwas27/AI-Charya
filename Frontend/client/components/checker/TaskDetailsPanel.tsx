// src/components/checker/TaskDetailsPanel.tsx

import React from 'react';

// ✨ NEW: Define the structure for the task details object
interface TaskDetails {
  subject: string;
  chapter: string;
  mode: string;
  totalScored: number | null;
  grade: string
}

// ✨ CHANGED: Update props to make this a controlled component
interface TaskDetailsPanelProps {
  task: TaskDetails;
  onTaskChange: (updatedTask: TaskDetails) => void;
  isEditable: boolean; // Prop to control if fields are enabled or disabled
}

export default function TaskDetailsPanel({ task, onTaskChange, isEditable }: TaskDetailsPanelProps) {
  
  // A single handler to report changes back to the parent component
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Call the parent's handler with the new state
    onTaskChange({
      ...task,
      [name]: value,
    });
  };

  return (
    <div className={`p-4 bg-white border-2 ${isEditable ? 'border-blue-400' : 'border-gray-300'} rounded-lg shadow-md flex-grow`}>
      <div className="space-y-4 text-gray-800">

        {/* Subject Input */}
        <div>
          <label htmlFor="grade" className="font-bold text-sm text-gray-600">GRADE</label>
          <input
            type="text"
            id="grade"
            name="grade"
            value={task.grade || ''}
            onChange={handleChange}
            disabled={!isEditable} // 
            placeholder="e.g., 1st"
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
          />
        </div>
        
        {/* Subject Input */}
        <div>
          <label htmlFor="subject" className="font-bold text-sm text-gray-600">SUBJECT</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={task.subject || ''}
            onChange={handleChange}
            disabled={!isEditable} // ✨ NEW: Control editability
            placeholder="e.g., Physics"
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
          />
        </div>

        {/* Chapter Input */}
        <div>
          <label htmlFor="chapter" className="font-bold text-sm text-gray-600">CHAPTER</label>
          <input
            type="text"
            id="chapter"
            name="chapter"
            value={task.chapter || ''}
            onChange={handleChange}
            disabled={!isEditable} 
            placeholder="e.g., Light and Reflection"
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
          />
        </div>

        {/* Mode Input */}
        <div>
          <label htmlFor="mode" className="font-bold text-sm text-gray-600">MODE</label>
          <input
            type="text"
            id="mode"
            name="mode"
            value={task.mode || ''}
            onChange={handleChange}
            disabled={!isEditable} // ✨ NEW: Control editability
            placeholder="e.g., Interactive"
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
          />
        </div>

        <hr className="my-2"/>

        {/* Non-editable fields */}
        <p><span className="font-bold">TOTAL SCORED:</span> {task.totalScored || 'N/A'}</p>
        <p><span className="font-bold">PENDING HW/ORAL/TEST:</span> {'N/A'}</p>

        {/* The update button is removed, as the parent now controls the data flow. */}
      </div>
    </div>
  );
}