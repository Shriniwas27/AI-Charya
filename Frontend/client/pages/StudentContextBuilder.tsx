import { useState } from "react";
import {
  Users,
  Upload,
  UserPlus,
  Sparkles,
  MapPin,
  Heart,
  Brain,
  FileText,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number;
  gender: string;
  language: string;
  background: string;
  hobbies: string[];
  level: "Beginner" | "Average" | "Advanced";
}

interface ContextStory {
  studentId: string;
  story: string;
  questions: string[];
}

const dummyStudents: Student[] = [
  {
    id: "1",
    name: "Ravi",
    age: 9,
    gender: "Male",
    language: "Marathi",
    background: "Farmer's son",
    hobbies: ["Cricket", "Drawing"],
    level: "Average",
  },
  {
    id: "2",
    name: "Priya",
    age: 8,
    gender: "Female",
    language: "Hindi",
    background: "Teacher's daughter",
    hobbies: ["Reading", "Dancing"],
    level: "Advanced",
  },
  {
    id: "3",
    name: "Arjun",
    age: 10,
    gender: "Male",
    language: "Tamil",
    background: "Shopkeeper's son",
    hobbies: ["Football", "Cooking"],
    level: "Beginner",
  },
  {
    id: "4",
    name: "Kavya",
    age: 9,
    gender: "Female",
    language: "Kannada",
    background: "Artist's daughter",
    hobbies: ["Painting", "Music"],
    level: "Advanced",
  },
];

const levelColors = {
  Beginner: "bg-material-orange text-white",
  Average: "bg-material-yellow text-material-gray-900",
  Advanced: "bg-material-green text-white",
};

export default function StudentContextBuilder() {
  const [students, setStudents] = useState<Student[]>(dummyStudents);
  const [showForm, setShowForm] = useState(false);
  const [contextStories, setContextStories] = useState<ContextStory[]>([]);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: "",
    age: 0,
    gender: "",
    language: "",
    background: "",
    hobbies: [],
    level: "Average",
  });

  const generateContextStory = (student: Student) => {
    const hobbyContext = student.hobbies[0] || "learning";
    const backgroundContext = student.background.toLowerCase();

    const story = `${student.name}, ${student.age}, ${student.language} speaker from a ${backgroundContext} family who loves ${hobbyContext.toLowerCase()} → learns soil types through a story about how different soils affect ${hobbyContext.toLowerCase()} activities. The clay soil near the ${hobbyContext.toLowerCase()} field holds water well, while sandy soil drains quickly, just like how ${student.name} notices in their daily ${hobbyContext.toLowerCase()} practice.`;

    const questions = [
      `How do you think ${hobbyContext.toLowerCase()} activities change in different types of soil, ${student.name}?`,
      `Can you share what you've noticed about the ground when you play ${hobbyContext.toLowerCase()}?`,
      `What would happen if we tried ${hobbyContext.toLowerCase()} on wet clay soil versus dry sandy soil?`,
    ];

    const newContextStory: ContextStory = {
      studentId: student.id,
      story,
      questions,
    };

    setContextStories((prev) => [
      ...prev.filter((cs) => cs.studentId !== student.id),
      newContextStory,
    ]);
  };

  const addStudent = () => {
    if (newStudent.name && newStudent.age) {
      const student: Student = {
        id: Date.now().toString(),
        name: newStudent.name,
        age: newStudent.age,
        gender: newStudent.gender || "",
        language: newStudent.language || "",
        background: newStudent.background || "",
        hobbies: newStudent.hobbies || [],
        level: newStudent.level || "Average",
      };

      setStudents((prev) => [...prev, student]);
      setNewStudent({
        name: "",
        age: 0,
        gender: "",
        language: "",
        background: "",
        hobbies: [],
        level: "Average",
      });
      setShowForm(false);
    }
  };

  const handleHobbiesChange = (hobbies: string) => {
    setNewStudent((prev) => ({
      ...prev,
      hobbies: hobbies
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean),
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-material-blue mr-3" />
            <h1 className="text-3xl font-bold text-material-gray-900">
              Student Context Builder
            </h1>
          </div>
          <p className="text-material-gray-600">
            Build comprehensive student profiles and generate personalized
            learning content
          </p>
        </div>

        {/* Top Area - Upload/Form Controls */}
        <div className="material-card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <UserPlus className="h-6 w-6 text-material-green mr-3" />
              <h2 className="text-xl font-semibold text-material-gray-900">
                🧑‍🎓 Student Information
              </h2>
            </div>
            <div className="flex gap-3">
              <button className="material-button-secondary flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="material-button-primary flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </button>
            </div>
          </div>

          {/* Add Student Form */}
          {showForm && (
            <div className="border-t border-material-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newStudent.name || ""}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="material-input"
                    placeholder="Student name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={newStudent.age || ""}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        age: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="material-input"
                    placeholder="Age"
                    min="1"
                    max="18"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newStudent.gender || ""}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="material-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Mother Tongue
                  </label>
                  <input
                    type="text"
                    value={newStudent.language || ""}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                    className="material-input"
                    placeholder="e.g., Hindi, Marathi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Learning Level
                  </label>
                  <select
                    value={newStudent.level || "Average"}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        level: e.target.value as
                          | "Beginner"
                          | "Average"
                          | "Advanced",
                      }))
                    }
                    className="material-input"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Average">Average</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Family Background
                  </label>
                  <input
                    type="text"
                    value={newStudent.background || ""}
                    onChange={(e) =>
                      setNewStudent((prev) => ({
                        ...prev,
                        background: e.target.value,
                      }))
                    }
                    className="material-input"
                    placeholder="e.g., Farmer's son"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-material-gray-700 mb-1">
                    Hobbies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newStudent.hobbies?.join(", ") || ""}
                    onChange={(e) => handleHobbiesChange(e.target.value)}
                    className="material-input"
                    placeholder="e.g., Cricket, Drawing, Reading"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="material-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addStudent}
                  className="material-button-primary"
                >
                  Add Student
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Cards Grid */}
        <div className="material-card-elevated p-6">
          <div className="flex items-center mb-6">
            <Brain className="h-6 w-6 text-material-orange mr-3" />
            <h2 className="text-xl font-semibold text-material-gray-900">
              🧩 Student Profiles & Context Generation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map((student) => {
              const contextStory = contextStories.find(
                (cs) => cs.studentId === student.id,
              );

              return (
                <div key={student.id} className="material-card p-4">
                  {/* Student Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-material-gray-900">
                        {student.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          levelColors[student.level]
                        }`}
                      >
                        {student.level}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-material-gray-600">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Age {student.age}, {student.gender}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {student.language} speaker
                      </div>
                      <div className="flex items-start">
                        <Heart className="h-3 w-3 mr-1 mt-0.5" />
                        <span>{student.hobbies.join(", ")}</span>
                      </div>
                      <div className="text-xs bg-material-gray-100 px-2 py-1 rounded">
                        {student.background}
                      </div>
                    </div>
                  </div>

                  {/* Generate Story Button */}
                  <button
                    onClick={() => generateContextStory(student)}
                    className="material-button-primary w-full mb-4 text-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Story
                  </button>

                  {/* Context Story Output */}
                  {contextStory && (
                    <div className="space-y-3">
                      <div className="bg-material-blue-50 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 text-material-blue mr-2" />
                          <span className="text-sm font-medium text-material-blue">
                            Context Story
                          </span>
                        </div>
                        <p className="text-xs text-material-gray-700 leading-relaxed">
                          {contextStory.story}
                        </p>
                      </div>

                      <div className="bg-material-green-50 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Brain className="h-4 w-4 text-material-green mr-2" />
                          <span className="text-sm font-medium text-material-green">
                            Revision Questions
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {contextStory.questions.map((question, index) => (
                            <li
                              key={index}
                              className="text-xs text-material-gray-700"
                            >
                              {index + 1}. {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {students.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-material-gray-300 mx-auto mb-4" />
              <p className="text-material-gray-500">
                No students added yet. Add students to start building their
                context profiles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
