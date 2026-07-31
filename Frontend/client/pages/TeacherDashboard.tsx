import { Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  FileText,
  Calendar,
  Users,
  Eye,
  Edit,
  CheckCircle,
  Download,
  TrendingUp,
  AlertTriangle,
  Mic,
  BarChart3,
  School,
} from "lucide-react";

interface ClassSchedule {
  time: string;
  class: string;
  subject: string;
  topic: string;
}

interface SyllabusItem {
  id: string;
  class: string;
  subject: string;
  uploadDate: string;
  status: "Active" | "Draft";
}

interface JointLesson {
  id: string;
  topic: string;
  classes: string[];
  suggestedWeek: string;
  completed: boolean;
}

interface SubjectProgress {
  subject: string;
  progress: number;
  color: string;
}

interface WeakSubject {
  subject: string;
  percentage: number;
  color: string;
}

interface ClassAttendance {
  class: string;
  present: number;
  total: number;
}

// Dummy Data
const todaySchedule: ClassSchedule[] = [
  { time: "9:00", class: "Class 5", subject: "Math", topic: "Fractions" },
  { time: "10:00", class: "Class 4", subject: "Science", topic: "Water Cycle" },
  {
    time: "11:00",
    class: "Class 3",
    subject: "English",
    topic: "Story Writing",
  },
  { time: "12:00", class: "Class 5", subject: "Hindi", topic: "Poetry" },
  { time: "2:00", class: "Class 4", subject: "Math", topic: "Geometry" },
];

const syllabusData: SyllabusItem[] = [
  {
    id: "1",
    class: "Class 3",
    subject: "Science",
    uploadDate: "2024-01-15",
    status: "Active",
  },
  {
    id: "2",
    class: "Class 4",
    subject: "Mathematics",
    uploadDate: "2024-01-10",
    status: "Active",
  },
  {
    id: "3",
    class: "Class 5",
    subject: "English",
    uploadDate: "2024-01-08",
    status: "Active",
  },
  {
    id: "4",
    class: "Class 3",
    subject: "Hindi",
    uploadDate: "2024-01-05",
    status: "Draft",
  },
  {
    id: "5",
    class: "Class 4",
    subject: "EVS",
    uploadDate: "2024-01-03",
    status: "Active",
  },
];

const jointLessons: JointLesson[] = [
  {
    id: "1",
    topic: "Water Cycle",
    classes: ["Class 3", "Class 4"],
    suggestedWeek: "Week 15",
    completed: false,
  },
  {
    id: "2",
    topic: "Plant Life",
    classes: ["Class 2", "Class 3"],
    suggestedWeek: "Week 12",
    completed: true,
  },
  {
    id: "3",
    topic: "Basic Addition",
    classes: ["Class 1", "Class 2"],
    suggestedWeek: "Week 8",
    completed: false,
  },
  {
    id: "4",
    topic: "Animals",
    classes: ["Class 3", "Class 4", "Class 5"],
    suggestedWeek: "Week 20",
    completed: false,
  },
];

const syllabusProgress: SubjectProgress[] = [
  { subject: "Math", progress: 75, color: "bg-material-blue" },
  { subject: "Science", progress: 60, color: "bg-material-green" },
  { subject: "English", progress: 85, color: "bg-material-orange" },
  { subject: "Hindi", progress: 55, color: "bg-material-yellow" },
];

const weakSubjects: WeakSubject[] = [
  { subject: "Science", percentage: 45, color: "bg-red-500" },
  { subject: "Math", percentage: 35, color: "bg-material-orange" },
  { subject: "Hindi", percentage: 20, color: "bg-material-yellow" },
];

const todayAttendance: ClassAttendance[] = [
  { class: "Class 3", present: 22, total: 25 },
  { class: "Class 4", present: 19, total: 22 },
  { class: "Class 5", present: 26, total: 28 },
];

const weeklyAttendance = [
  { day: "Mon", percentage: 88 },
  { day: "Tue", percentage: 92 },
  { day: "Wed", percentage: 85 },
  { day: "Thu", percentage: 90 },
  { day: "Fri", percentage: 87 },
  { day: "Sat", percentage: 82 },
  { day: "Sun", percentage: 0 },
];

export default function TeacherDashboard() {
  const getAttendanceColor = (present: number, total: number) => {
    const percentage = (present / total) * 100;
    if (percentage >= 90) return "text-material-green";
    if (percentage >= 75) return "text-material-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-material-gray-900 mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-lg text-material-gray-600">
          Welcome back! Here's your teaching overview for today.
        </p>
      </div>

      {/* Section 1: Today's Class Schedule */}
      <section className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
        <div className="flex items-center mb-6">
          <Clock className="h-6 w-6 text-material-blue mr-3" />
          <h2 className="text-2xl font-semibold text-material-gray-900">
            🎯 Today's Class Schedule
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-material-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900 rounded-l-lg">
                  Time
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Class
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Subject
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900 rounded-r-lg">
                  Topic
                </th>
              </tr>
            </thead>
            <tbody>
              {todaySchedule.map((schedule, index) => (
                <tr
                  key={index}
                  className="border-b border-material-gray-100 hover:bg-material-gray-50"
                >
                  <td className="py-4 px-4 font-medium text-material-blue">
                    {schedule.time}
                  </td>
                  <td className="py-4 px-4 text-material-gray-700">
                    {schedule.class}
                  </td>
                  <td className="py-4 px-4 text-material-gray-700">
                    {schedule.subject}
                  </td>
                  <td className="py-4 px-4 text-material-gray-700">
                    {schedule.topic}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-4">
          {todaySchedule.map((schedule, index) => (
            <div key={index} className="bg-material-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-material-blue text-lg">
                  {schedule.time}
                </span>
                <span className="text-material-gray-600 text-sm">
                  {schedule.class}
                </span>
              </div>
              <div className="text-material-gray-900 font-medium">
                {schedule.subject}
              </div>
              <div className="text-material-gray-600 text-sm">
                {schedule.topic}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Class-Wise Study Material Access */}
      <section className="bg-gradient-to-r from-material-yellow-50 to-material-yellow-100 rounded-xl border border-material-yellow-200 p-8 text-center shadow-material">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-material-yellow-600 mr-3" />
          <h2 className="text-2xl font-semibold text-material-gray-900">
            📘 Class-Wise Study Material
          </h2>
        </div>
        <p className="text-material-gray-600 mb-6 text-lg">
          Access lectures, chapters, and tests organized by class
        </p>
        <Link
          to="/class-material"
          className="inline-flex items-center bg-material-yellow text-material-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-material-yellow-600 hover:text-white transition-all duration-200 hover:scale-105 shadow-material"
        >
          <School className="h-5 w-5 mr-2" />
          Go to Study Material
        </Link>
      </section>

      {/* Section 3: My Syllabus */}
      <section className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-material-green mr-3" />
            <h2 className="text-2xl font-semibold text-material-gray-900">
              📚 My Syllabus
            </h2>
          </div>
          <Link
            to="/curriculum"
            className="text-material-green hover:text-material-green-600 font-medium"
          >
            Upload New
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-material-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Class
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Subject
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Upload Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-material-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {syllabusData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-material-gray-100 hover:bg-material-gray-50"
                >
                  <td className="py-4 px-4 font-medium">{item.class}</td>
                  <td className="py-4 px-4">{item.subject}</td>
                  <td className="py-4 px-4 text-material-gray-600">
                    {item.uploadDate}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Active"
                          ? "bg-material-green text-white"
                          : "bg-material-yellow text-material-gray-900"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button className="bg-material-gray-100 text-material-gray-700 px-3 py-1 rounded text-sm hover:bg-material-gray-200 flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        View Topics
                      </button>
                      <button className="bg-material-blue text-white px-3 py-1 rounded text-sm hover:bg-material-blue-600 flex items-center">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Metadata
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Joint Lessons */}
      <section className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
        <div className="flex items-center mb-6">
          <Calendar className="h-6 w-6 text-material-orange mr-3" />
          <h2 className="text-2xl font-semibold text-material-gray-900">
            🤝 Joint Teaching Opportunities
          </h2>
        </div>

        <div className="space-y-4">
          {jointLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-material-gray-50 rounded-lg p-4 border border-material-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-material-gray-900 mr-3">
                      {lesson.topic}
                    </h3>
                    {lesson.completed && (
                      <span className="bg-material-green text-white px-2 py-1 rounded-full text-xs">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-material-gray-600 mb-1">
                    <strong>Appears In:</strong> {lesson.classes.join(", ")}
                  </div>
                  <div className="text-sm text-material-gray-600">
                    <strong>Suggested Teaching Week:</strong>{" "}
                    {lesson.suggestedWeek}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                      lesson.completed
                        ? "bg-material-gray-100 text-material-gray-700"
                        : "bg-material-green text-white hover:bg-material-green-600"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {lesson.completed ? "Completed" : "Mark Completed"}
                  </button>
                  <button className="bg-material-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-material-blue-600 flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Student Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Syllabus Progress */}
        <div className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-material-green mr-3" />
            <h3 className="text-xl font-semibold text-material-gray-900">
              Syllabus Progress
            </h3>
          </div>
          <div className="space-y-4">
            {syllabusProgress.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-material-gray-700 font-medium">
                    {item.subject}
                  </span>
                  <span className="text-material-gray-600 text-sm">
                    {item.progress}%
                  </span>
                </div>
                <div className="w-full bg-material-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Subjects */}
        <div className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-xl font-semibold text-material-gray-900">
              Weak Subjects
            </h3>
          </div>
          <div className="space-y-3">
            {weakSubjects.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${item.color} mr-3`} />
                  <span className="text-material-gray-900 font-medium">
                    {item.subject}
                  </span>
                </div>
                <span className="text-red-600 font-semibold">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Students Present */}
        <div className="bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-material-blue mr-3" />
            <h3 className="text-xl font-semibold text-material-gray-900">
              Students Present Today
            </h3>
          </div>
          <div className="space-y-3">
            {todayAttendance.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-material-gray-50 rounded-lg"
              >
                <span className="text-material-gray-900 font-medium">
                  {item.class}
                </span>
                <div className="flex items-center">
                  <span
                    className={`font-semibold ${getAttendanceColor(item.present, item.total)}`}
                  >
                    {item.present}/{item.total}
                  </span>
                  <div className="ml-2">
                    {(item.present / item.total) * 100 >= 80 ? (
                      <CheckCircle className="h-4 w-4 text-material-green" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Attendance Trend (Hidden on mobile) */}
      <section className="hidden lg:block bg-white rounded-xl border border-material-gray-200 p-6 shadow-material">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-material-green mr-3" />
          <h2 className="text-2xl font-semibold text-material-gray-900">
            📈 Weekly Attendance Trend
          </h2>
        </div>
        <div className="flex items-end justify-between h-40 bg-material-gray-50 rounded-lg p-4">
          {weeklyAttendance.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="bg-material-green rounded-t-lg w-8 transition-all duration-500 hover:bg-material-green-600"
                style={{
                  height: `${day.percentage > 0 ? (day.percentage / 100) * 120 : 4}px`,
                }}
              />
              <span className="text-xs text-material-gray-600 mt-2">
                {day.day}
              </span>
              <span className="text-xs text-material-gray-500">
                {day.percentage}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7: Voice Notes */}
      <section className="bg-gradient-to-r from-material-blue-50 to-material-blue-100 rounded-xl border border-material-blue-200 p-6 shadow-material">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-material-blue rounded-full p-3 mr-4">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-material-gray-900">
                🎤 Record Quick Note
              </h3>
              <p className="text-material-gray-600">
                Capture important reminders or observations
              </p>
            </div>
          </div>
          <button className="bg-material-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-material-blue-600 transition-all duration-200 hover:scale-105 shadow-material flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Record
          </button>
        </div>
      </section>
    </div>
  );
}
