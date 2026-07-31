import { useState } from "react";
import { FileText, Sparkles, Save, BookOpen, Users, Clock } from "lucide-react";

interface LecturePlate {
  id: string;
  topic: string;
  story: string;
  image: string;
  guidelines: string[];
  createdAt: string;
}

const dummyChapters = [
  "Water Cycle",
  "Plant Life",
  "Animals and Their Homes",
  "Air Around Us",
  "States of Matter",
  "Solar System",
  "Food and Nutrition",
  "Transportation",
];

const savedLecturePlates: LecturePlate[] = [
  {
    id: "1",
    topic: "Water Cycle",
    story:
      "Once in Maharashtra, there lived a young farmer named Arjun who wondered why the clouds brought rain to his fields. Every morning, he noticed water disappearing from his well, rising up like invisible spirits to form clouds above. The sun, like a powerful king, would call the water up to the sky, where it would dance as clouds before returning as rain to nourish his crops.",
    image: "https://placehold.co/300x200/4285F4/FFFFFF?text=Water+Cycle",
    guidelines: [
      "Use chalk to draw the water cycle on the blackboard",
      "Ask students to mimic the water cycle with hand gestures",
      "Have students share their own observations of rain and evaporation",
      "Connect the story to local farming practices",
    ],
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    topic: "Plant Life",
    story:
      "In a small village in Gujarat, little Meera discovered that her grandmother's mango tree had different parts that worked like a family. The roots were like the hardworking father, digging deep to find water. The trunk was like the strong mother, supporting everyone. The leaves were like playful children, catching sunlight and making food for the whole tree family.",
    image: "https://placehold.co/300x200/34A853/FFFFFF?text=Plant+Parts",
    guidelines: [
      "Bring a small plant to class for demonstration",
      "Have students identify plant parts in the school garden",
      "Use local examples of trees and plants",
      "Create a family tree analogy worksheet",
    ],
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    topic: "Solar System",
    story:
      "High in the mountains of Himachal Pradesh, young Tenzin loved watching the stars with his grandfather. His grandfather told him that the Sun was like the village chief, and all the planets were like villagers dancing around him. Earth was the special village where all the children lived, while the Moon was like a faithful dog, always following Earth around.",
    image: "https://placehold.co/300x200/FB7C00/FFFFFF?text=Solar+System",
    guidelines: [
      "Use a flashlight and balls to demonstrate planetary motion",
      "Have students create their own planet dance",
      "Share local stories about stars and planets",
      "Make planet size comparisons using familiar objects",
    ],
    createdAt: "2024-01-10",
  },
];

export default function LecturePlateGenerator() {
  const [selectedChapter, setSelectedChapter] = useState("");
  const [promptText, setPromptText] = useState(
    "Explain this topic with a local story",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<LecturePlate | null>(
    null,
  );

  const handleGenerate = async () => {
    if (!selectedChapter) return;

    setIsGenerating(true);

    // Simulate API call with delay
    setTimeout(() => {
      const newLecturePlate: LecturePlate = {
        id: Date.now().toString(),
        topic: selectedChapter,
        story: `Once upon a time in a beautiful village in Karnataka, there lived a curious child named Kavya who loved to explore. While studying ${selectedChapter.toLowerCase()}, Kavya discovered how this concept connected to daily life in her village. Through her adventures, she learned the importance of understanding ${selectedChapter.toLowerCase()} and how it affects everyone around her.`,
        image: `https://placehold.co/300x200/4285F4/FFFFFF?text=${encodeURIComponent(selectedChapter)}`,
        guidelines: [
          `Start with local examples related to ${selectedChapter.toLowerCase()}`,
          "Use interactive demonstrations and hands-on activities",
          "Encourage students to share their own experiences",
          "Connect the lesson to real-world applications",
          "Include visual aids and simple drawings",
        ],
        createdAt: new Date().toISOString().split("T")[0],
      };

      setGeneratedContent(newLecturePlate);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSaveToLessons = () => {
    if (generatedContent) {
      // In a real app, this would save to a database
      alert("Lecture plate saved to your lessons!");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-material-blue mr-3" />
            <h1 className="text-3xl font-bold text-material-gray-900">
              📋 Lecture Plate Generator
            </h1>
          </div>
          <p className="text-material-gray-600">
            Generate localized, context-aware lecture content with stories and
            teaching guidelines
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Panel - Input Controls */}
          <div className="material-card-elevated p-6">
            <div className="flex items-center mb-6">
              <Sparkles className="h-6 w-6 text-material-green mr-3" />
              <h2 className="text-xl font-semibold text-material-gray-900">
                🧩 Input Controls
              </h2>
            </div>

            <div className="space-y-6">
              {/* Chapter Selection */}
              <div>
                <label className="block text-sm font-medium text-material-gray-700 mb-2">
                  Select Chapter
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="material-input"
                >
                  <option value="">Choose a chapter...</option>
                  {dummyChapters.map((chapter) => (
                    <option key={chapter} value={chapter}>
                      {chapter}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Prompt */}
              <div>
                <label className="block text-sm font-medium text-material-gray-700 mb-2">
                  Teaching Prompt
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={4}
                  className="material-input resize-none"
                  placeholder="Describe how you'd like to teach this topic..."
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedChapter || isGenerating}
                className={`material-button-primary w-full ${
                  isGenerating ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Lecture Plate
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="material-card-elevated p-6">
            <div className="flex items-center mb-6">
              <BookOpen className="h-6 w-6 text-material-orange mr-3" />
              <h2 className="text-xl font-semibold text-material-gray-900">
                🖼 Generated Content
              </h2>
            </div>

            {generatedContent ? (
              <div className="space-y-6">
                {/* Localized Story */}
                <div className="material-card p-4">
                  <div className="flex items-center mb-3">
                    <BookOpen className="h-5 w-5 text-material-blue mr-2" />
                    <h3 className="font-semibold text-material-gray-900">
                      📖 Localized Story
                    </h3>
                  </div>
                  <p className="text-material-gray-700 leading-relaxed">
                    {generatedContent.story}
                  </p>
                </div>

                {/* Line Drawing */}
                <div className="material-card p-4">
                  <div className="flex items-center mb-3">
                    <img
                      className="h-5 w-5 mr-2"
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjEgMTVsLTMuMDg2LTMuMDg2YTIgMiAwIDAwLTIuODI4IDBMMTQgMTMiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+"
                      alt="Image"
                    />
                    <h3 className="font-semibold text-material-gray-900">
                      🖼 Visual Aid
                    </h3>
                  </div>
                  <div className="bg-material-gray-50 rounded-lg p-4">
                    <img
                      src={generatedContent.image}
                      alt={`Visual aid for ${generatedContent.topic}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Teacher Guidelines */}
                <div className="material-card p-4">
                  <div className="flex items-center mb-3">
                    <Users className="h-5 w-5 text-material-green mr-2" />
                    <h3 className="font-semibold text-material-gray-900">
                      🧑‍🏫 Teacher Guidelines
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {generatedContent.guidelines.map((guideline, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-material-green rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-material-gray-700">
                          {guideline}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveToLessons}
                  className="material-button-primary w-full"
                >
                  <Save className="h-5 w-5 mr-2" />
                  📥 Save to My Lessons
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-material-gray-300 mx-auto mb-4" />
                <p className="text-material-gray-500">
                  Select a chapter and click "Generate" to create your lecture
                  plate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Saved Lecture Plates */}
        <div className="material-card-elevated p-6">
          <div className="flex items-center mb-6">
            <Save className="h-6 w-6 text-material-yellow mr-3" />
            <h2 className="text-xl font-semibold text-material-gray-900">
              🗂 My Saved Lecture Plates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLecturePlates.map((plate) => (
              <div
                key={plate.id}
                className="material-card p-4 hover:shadow-material-md transition-shadow"
              >
                <div className="mb-4">
                  <img
                    src={plate.image}
                    alt={`Visual for ${plate.topic}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>

                <h3 className="font-semibold text-material-gray-900 mb-2">
                  {plate.topic}
                </h3>

                <p className="text-sm text-material-gray-600 mb-3 line-clamp-3">
                  {plate.story.substring(0, 120)}...
                </p>

                <div className="flex items-center justify-between text-xs text-material-gray-500 mb-3">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {plate.createdAt}
                  </div>
                  <span className="bg-material-blue-100 text-material-blue-700 px-2 py-1 rounded-full">
                    {plate.guidelines.length} guidelines
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="material-button-secondary text-xs px-3 py-1 flex-1">
                    View Details
                  </button>
                  <button className="material-button-primary text-xs px-3 py-1 flex-1">
                    Use Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
