import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  title: string;
  pdfLink: string;
}

interface SyllabusData {
  class: string;
  subject: string;
  chapters: Chapter[];
}

interface TopicMapping {
  topic: string;
  appearsIn: string[];
  suggestedTimeline?: {
    week: number;
    duration: string;
    activities: string;
  }[];
  recommendedGrouping?: string[];
}

const dummySyllabus: SyllabusData = {
  class: "3",
  subject: "Science",
  chapters: [
    { title: "Water Cycle", pdfLink: "example.com/sample.pdf" },
    { title: "Plants and Their Parts", pdfLink: "example.com/sample2.pdf" },
    { title: "Animals and Their Homes", pdfLink: "example.com/sample3.pdf" },
    { title: "Air Around Us", pdfLink: "example.com/sample4.pdf" },
  ],
};

const dummyTopicMappings: TopicMapping[] = [
  {
    topic: "Water Cycle",
    appearsIn: ["Class 3", "Class 5"],
    suggestedTimeline: [
      {
        week: 1,
        duration: "45 mins",
        activities: "Introduction to water states",
      },
      {
        week: 2,
        duration: "45 mins",
        activities: "Evaporation and condensation",
      },
      {
        week: 3,
        duration: "45 mins",
        activities: "Precipitation and collection",
      },
    ],
    recommendedGrouping: ["Class 3", "Class 4"],
  },
  {
    topic: "Plant Life",
    appearsIn: ["Class 2", "Class 3", "Class 4"],
    suggestedTimeline: [
      {
        week: 1,
        duration: "30 mins",
        activities: "Plant parts identification",
      },
      {
        week: 2,
        duration: "30 mins",
        activities: "Growth and nutrition",
      },
    ],
    recommendedGrouping: ["Class 3", "Class 4"],
  },
];

export default function CurriculumUpload() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(),
  );
  const [selectedMapping, setSelectedMapping] = useState<TopicMapping | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const subjects = ["Math", "Science", "English", "Hindi", "Social Studies"];
  const boards = ["CBSE", "State Board", "ICSE", "IB"];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type === "application/pdf") {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploaded(true);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const handleJointLessonPlan = (mapping: TopicMapping) => {
    setSelectedMapping(mapping);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-material-gray-900 mb-2">
            Curriculum Upload
          </h1>
          <p className="text-material-gray-600">
            Upload your curriculum PDF and explore smart topic mapping across
            classes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Curriculum */}
          <div className="space-y-6">
            <div className="material-card-elevated p-6">
              <div className="flex items-center mb-6">
                <Upload className="h-6 w-6 text-material-blue mr-3" />
                <h2 className="text-xl font-semibold text-material-gray-900">
                  Upload Curriculum PDF
                </h2>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="material-input"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="material-input"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-2">
                    Board
                  </label>
                  <select
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value)}
                    className="material-input"
                  >
                    <option value="">Select Board</option>
                    {boards.map((board) => (
                      <option key={board} value={board}>
                        {board}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragOver
                    ? "border-material-blue bg-material-blue-50"
                    : "border-material-gray-300 hover:border-material-gray-400",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 text-material-gray-400 mx-auto mb-4" />
                <p className="text-material-gray-600 mb-2">
                  Drag and drop your PDF file here, or{" "}
                  <span className="text-material-blue cursor-pointer">
                    browse
                  </span>
                </p>
                <p className="text-sm text-material-gray-500">
                  Supports PDF files up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Upload Button */}
              <button
                className="material-button-primary w-full mt-6"
                disabled={!selectedClass || !selectedSubject || !selectedBoard}
              >
                Upload & Process
              </button>

              {/* Progress Bar */}
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-material-gray-600 mb-2">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-material-gray-200 rounded-full h-2">
                    <div
                      className="bg-material-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Syllabus Tree */}
            {isUploaded && (
              <div className="material-card-elevated p-6">
                <h3 className="text-lg font-semibold text-material-gray-900 mb-4">
                  Extracted Syllabus Structure
                </h3>
                <div className="space-y-2">
                  <div className="text-sm text-material-gray-600 mb-4">
                    Class {dummySyllabus.class} → {dummySyllabus.subject}
                  </div>
                  {dummySyllabus.chapters.map((chapter, index) => (
                    <div key={index} className="border rounded-lg">
                      <button
                        onClick={() => toggleChapter(index)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-material-gray-50 transition-colors"
                      >
                        <span className="font-medium text-material-gray-800">
                          {chapter.title}
                        </span>
                        {expandedChapters.has(index) ? (
                          <ChevronDown className="h-4 w-4 text-material-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-material-gray-500" />
                        )}
                      </button>
                      {expandedChapters.has(index) && (
                        <div className="p-3 border-t bg-material-gray-50">
                          <a
                            href={chapter.pdfLink}
                            className="text-material-blue hover:underline text-sm"
                          >
                            View PDF: {chapter.pdfLink}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Smart Topic Mapping */}
          <div className="space-y-6">
            <div className="material-card-elevated p-6">
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 text-material-green mr-3" />
                <h2 className="text-xl font-semibold text-material-gray-900">
                  Smart Topic Mapping
                </h2>
              </div>

              <div className="space-y-4">
                {dummyTopicMappings.map((mapping, index) => (
                  <div key={index} className="material-card p-4">
                    <h3 className="font-semibold text-material-gray-900 mb-2">
                      {mapping.topic}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-sm text-material-gray-600">
                        Appears in:
                      </span>
                      {mapping.appearsIn.map((cls) => (
                        <span
                          key={cls}
                          className="px-2 py-1 bg-material-gray-100 text-material-gray-700 rounded-full text-xs"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleJointLessonPlan(mapping)}
                      className="material-button-primary text-sm px-4 py-2"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Joint Lesson Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Joint Lesson Plan Output */}
            {selectedMapping && (
              <div className="material-card-elevated p-6">
                <h3 className="text-lg font-semibold text-material-gray-900 mb-4">
                  Joint Lesson Plan: {selectedMapping.topic}
                </h3>

                {/* Suggested Timeline */}
                <div className="mb-6">
                  <h4 className="font-medium text-material-gray-800 mb-3">
                    Suggested Timeline
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-material-gray-200">
                          <th className="text-left py-2 text-material-gray-700">
                            Week
                          </th>
                          <th className="text-left py-2 text-material-gray-700">
                            Duration
                          </th>
                          <th className="text-left py-2 text-material-gray-700">
                            Activities
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMapping.suggestedTimeline?.map(
                          (item, index) => (
                            <tr
                              key={index}
                              className="border-b border-material-gray-100"
                            >
                              <td className="py-2">{item.week}</td>
                              <td className="py-2">{item.duration}</td>
                              <td className="py-2">{item.activities}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommended Grouping */}
                <div>
                  <h4 className="font-medium text-material-gray-800 mb-3">
                    Recommended Grouping
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMapping.recommendedGrouping?.map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1 bg-material-blue text-white rounded-full text-sm"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
